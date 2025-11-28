import {
  createFileRoute,
  useNavigate,
  useRouter,
  useCanGoBack,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/components/auth/role-guard";
import {
  articleQueryOptions,
  categoriesQueryOptions,
  useArticle,
  useCategories,
  useArchiveArticle,
  useDeleteArticle,
  useUnpublishArticle,
  useUpdateArticle,
  wikiQueryKeys,
} from "@/features/wiki/api/wikiQueries";
import {
  ArticleEditorToolbar,
  ArticleTitleInput,
  ArticleMetadata,
  ArticleContentEditor,
  ExternalArticleMetadataEditor,
} from "@/features/wiki/components";
import { useArticleEditor } from "@/features/wiki/hooks/use-article-editor";
import { toast } from "sonner";
import { buildPageHead } from "@/lib/page-title";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_auth/wiki/$articleId/")({
  head: ({ params }) => buildPageHead(`Editar Artigo ${params.articleId}`),
  validateSearch: (search: Record<string, unknown>): { new?: string } => {
    return {
      new: search.new === "true" ? "true" : undefined,
    };
  },
  loader: async ({ context: { queryClient }, params: { articleId } }) => {
    const numericArticleId = Number(articleId);

    if (Number.isNaN(numericArticleId)) {
      throw new Error("Invalid article ID");
    }

    await Promise.all([
      queryClient.ensureQueryData(articleQueryOptions(numericArticleId)),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `Editar Artigo ${params.articleId}`,
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { articleId } = Route.useParams();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const numericArticleId = Number(articleId);
  const isNewDraftRef = useRef(search.new === "true");

  const articleQuery = useArticle(numericArticleId);

  // Invalidate queries after navigating to a newly created article
  useEffect(() => {
    if (search.new === "true") {
      // Invalidate articles list and stats to show the new article
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats() });

      // Remove the 'new' search param to avoid re-invalidating on subsequent renders
      navigate({
        to: "/wiki/$articleId",
        params: { articleId },
        search: { new: undefined },
        replace: true,
      });
    }
  }, [search.new, queryClient, navigate, articleId]);

  if (Number.isNaN(numericArticleId)) {
    return (
      <div className="flex h-full min-h-80 items-center justify-center">
        <div className="text-sm text-destructive">ID do artigo inválido.</div>
      </div>
    );
  }

  if (articleQuery.isPending) {
    return (
      <div className="flex h-full min-h-80 flex-col items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">
          Carregando editor...
        </span>
      </div>
    );
  }

  const article = articleQuery.data?.data;

  if (!article) {
    return (
      <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3">
        <span className="text-sm text-destructive">
          Não foi possível carregar este artigo.
        </span>
        <Button variant="outline" onClick={() => navigate({ to: "/wiki" })}>
          Voltar para a lista
        </Button>
      </div>
    );
  }

  return (
    <ArticleEditor
      articleId={numericArticleId}
      article={article}
      onPublish={() => {
        toast.success("Artigo publicado com sucesso.");
      }}
      isNewDraft={isNewDraftRef.current}
    />
  );
}

interface ArticleEditorProps {
  articleId: number;
  article: any;
  onPublish: () => void;
  isNewDraft: boolean;
}

function ArticleEditor({
  articleId,
  article,
  onPublish,
  isNewDraft,
}: ArticleEditorProps) {
  const { user } = usePermissions();
  const { data: categoriesData, isPending: categoriesLoading } =
    useCategories();
  const archiveMutation = useArchiveArticle();
  const unpublishMutation = useUnpublishArticle();
  const deleteMutation = useDeleteArticle();
  const updateMutation = useUpdateArticle();
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const categoriesList = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData?.data ?? []);

  const isExternalArticle = article?.data?.sourceType === "external";

  const {
    title,
    setTitle,
    status,
    setStatus,
    categoryId,
    setCategoryId,
    lastSavedAt,
    autoSaving,
    isUpdating,
    hasPendingChanges,
    selectedTags,
    setSelectedTags,
    setEditor,
    handleSave,
    handleEditorChange,
    handleUploadFile,
    canPublish,
    icon,
    setIcon,
    hasContent,
  } = useArticleEditor({
    articleId,
    article: article.data,
    onPublish,
    isNewDraft,
  });

  // External article state
  const [externalUrl, setExternalUrl] = useState(
    article?.data?.externalUrl || "",
  );
  const [externalAuthors, setExternalAuthors] = useState<string[]>(
    article?.data?.externalAuthors || [""],
  );
  const [publicationSource, setPublicationSource] = useState(
    article?.data?.publicationSource || "",
  );
  const [publicationDate, setPublicationDate] = useState(
    article?.data?.publicationDate
      ? new Date(article.data.publicationDate).toISOString().split("T")[0]
      : "",
  );
  const [excerpt, setExcerpt] = useState(article?.data?.excerpt || "");
  const hasDiscardedDraft = useRef(false);
  const hasContentRef = useRef(hasContent);

  useEffect(() => {
    hasContentRef.current = hasContent;
  }, [hasContent]);

  const discardDraft = useCallback(
    async ({
      navigateAfter = true,
      notify = true,
    }: { navigateAfter?: boolean; notify?: boolean } = {}) => {
      if (hasDiscardedDraft.current) return;
      if (hasContentRef.current) {
        if (notify) {
          toast.info(
            "Este rascunho já tem alterações. Exclua manualmente se desejar descartá-lo.",
          );
        }
        return;
      }

      try {
        await deleteMutation.mutateAsync(articleId);
        hasDiscardedDraft.current = true;
        if (notify) {
          toast.success("Rascunho descartado.");
        }
        if (navigateAfter) {
          navigate({ to: "/wiki" });
        }
      } catch (error) {
        console.error("Erro ao descartar rascunho:", error);
        if (notify) {
          toast.error("Não foi possível descartar o rascunho.");
        }
      }
    },
    [articleId, deleteMutation, navigate],
  );

  useEffect(() => {
    if (!isNewDraft) return;

    const toastId = toast("Rascunho criado.", {
      className: "justify-between items-center",
      action: (
        <Button size="sm" className="text-sm" onClick={() => discardDraft()}>
          Desfazer
        </Button>
      ),
      duration: 6000,
    });

    return () => {
      toast.dismiss(toastId);
    };
  }, [isNewDraft]);

  // Custom save handler for external articles
  const handleExternalArticleSave = async (publish = false) => {
    try {
      await updateMutation.mutateAsync({
        id: articleId,
        data: {
          title,
          externalUrl,
          externalAuthors: externalAuthors.filter((a) => a.trim()),
          publicationSource: publicationSource || undefined,
          publicationDate: publicationDate || undefined,
          excerpt: excerpt || undefined,
          categoryId,
          tagIds: selectedTags.length > 0 ? selectedTags : undefined,
          icon,
          status: publish ? "published" : status,
        },
      });

      if (publish && onPublish) {
        onPublish();
      }

      toast.success(publish ? "Artigo publicado!" : "Alterações salvas!");
    } catch (error) {
      console.error("Error saving external article:", error);
      toast.error("Erro ao salvar artigo");
    }
  };

  const handleArchiveArticle = async () => {
    try {
      await archiveMutation.mutateAsync(articleId);
      toast.success("Artigo arquivado com sucesso.");
      navigate({ to: "/wiki" });
    } catch (error) {
      console.error("Archive error:", error);
      toast.error("Não foi possível arquivar o artigo.");
    }
  };

  const handleUnpublishArticle = async () => {
    try {
      await unpublishMutation.mutateAsync(articleId);
      setStatus("draft");
      toast.success("Artigo movido para rascunho.");
    } catch (error) {
      console.error("Unpublish error:", error);
      toast.error("Não foi possível despublicar o artigo.");
    }
  };

  const handleDeleteArticle = async () => {
    try {
      await deleteMutation.mutateAsync(articleId);
      toast.success("Artigo excluído com sucesso.");
      navigate({ to: "/wiki" });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Não foi possível excluir o artigo.");
      throw error;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ArticleEditorToolbar
        status={status}
        isSaving={isExternalArticle ? updateMutation.isPending : isUpdating}
        autoSaving={autoSaving}
        lastSavedAt={lastSavedAt}
        hasPendingChanges={hasPendingChanges}
        canPublish={canPublish}
        articleTitle={title}
        onPublish={() =>
          isExternalArticle ? handleExternalArticleSave(true) : handleSave(true)
        }
        onUnpublish={handleUnpublishArticle}
        onArchive={handleArchiveArticle}
        onDelete={handleDeleteArticle}
        isArchiving={archiveMutation.isPending}
        isUnpublishing={unpublishMutation.isPending}
        isDeleting={deleteMutation.isPending}
        onBack={canGoBack ? () => router.history.back() : undefined}
      />

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-8 pb-24">
        <div className="w-full max-w-3xl border-b py-6">
          <ArticleTitleInput
            value={title}
            onChange={setTitle}
            icon={icon}
            onIconChange={setIcon}
          />

          <ArticleMetadata
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            categories={categoriesList}
            categoriesLoading={categoriesLoading}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            authorName={user?.name || "Anônimo"}
          />
        </div>

        {isExternalArticle ? (
          <ExternalArticleMetadataEditor
            externalUrl={externalUrl}
            externalAuthors={externalAuthors}
            publicationSource={publicationSource}
            publicationDate={publicationDate}
            excerpt={excerpt}
            onExternalUrlChange={setExternalUrl}
            onExternalAuthorsChange={setExternalAuthors}
            onPublicationSourceChange={setPublicationSource}
            onPublicationDateChange={setPublicationDate}
            onExcerptChange={setExcerpt}
          />
        ) : (
          <ArticleContentEditor
            articleId={articleId}
            initialContent={article?.data?.content}
            onEditorReady={setEditor}
            onChange={handleEditorChange}
            onUploadFile={handleUploadFile}
          />
        )}
      </div>
    </div>
  );
}
