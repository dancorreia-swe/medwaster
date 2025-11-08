import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/components/auth/role-guard";
import {
  articleQueryOptions,
  categoriesQueryOptions,
  useArticle,
  useCategories,
} from "@/features/wiki/api/wikiQueries";
import {
  ArticleEditorToolbar,
  ArticleTitleInput,
  ArticleMetadata,
  ArticleContentEditor,
} from "@/features/wiki/components";
import { useArticleEditor } from "@/features/wiki/hooks/use-article-editor";

export const Route = createFileRoute("/_auth/wiki/$articleId/")({
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
  const numericArticleId = Number(articleId);

  const articleQuery = useArticle(numericArticleId);

  if (Number.isNaN(numericArticleId)) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center">
        <div className="text-sm text-destructive">ID do artigo inválido.</div>
      </div>
    );
  }

  if (articleQuery.isPending) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">
          Carregando editor...
        </span>
      </div>
    );
  }

  const article = articleQuery.data?.data;

  if (!article) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3">
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
      onPublish={() => navigate({ to: "/wiki" })}
    />
  );
}

interface ArticleEditorProps {
  articleId: number;
  article: any;
  onPublish: () => void;
}

function ArticleEditor({ articleId, article, onPublish }: ArticleEditorProps) {
  const { user } = usePermissions();
  const { data: categoriesData, isPending: categoriesLoading } =
    useCategories();

  const {
    title,
    setTitle,
    status,
    categoryId,
    setCategoryId,
    lastSavedAt,
    autoSaving,
    isUpdating,
    selectedTags,
    setSelectedTags,
    setEditor,
    handleSave,
    handleEditorChange,
    handleUploadFile,
    canSave,
  } = useArticleEditor({
    articleId,
    article: article.data,
    onPublish,
  });

  return (
    <div className="flex h-full flex-col">
      <ArticleEditorToolbar
        status={status}
        isSaving={isUpdating}
        autoSaving={autoSaving}
        lastSavedAt={lastSavedAt}
        canSave={canSave}
        onSave={() => handleSave(false)}
        onPublish={() => handleSave(true)}
      />

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-8 pb-24">
        <div className="w-full max-w-3xl border-b py-6">
          <ArticleTitleInput value={title} onChange={setTitle} />

          <ArticleMetadata
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            categories={categoriesData?.data ?? []}
            categoriesLoading={categoriesLoading}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            authorName={user?.name || "Anônimo"}
          />
        </div>

        <ArticleContentEditor
          articleId={articleId}
          initialContent={article?.data?.content}
          onEditorReady={setEditor}
          onChange={handleEditorChange}
          onUploadFile={handleUploadFile}
        />
      </div>
    </div>
  );
}
