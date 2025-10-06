import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { usePermissions } from "@/components/auth/role-guard";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import {
  useArticle,
  useCategories,
  useUpdateArticle,
} from "@/features/wiki/api/wikiQueries";
import { wikiApi } from "@/features/wiki/api/wikiApi";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { pt } from "@blocknote/core/locales";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from "@/components/ui/shadcn-io/tags";
import {
  CheckIcon,
  Earth,
  Folder,
  PlusIcon,
  Save,
  Tag,
  User,
} from "lucide-react";

const DEFAULT_TAG_OPTIONS = [
  { id: "react", label: "React" },
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "nextjs", label: "Next.js" },
  { id: "vuejs", label: "Vue.js" },
  { id: "angular", label: "Angular" },
  { id: "svelte", label: "Svelte" },
  { id: "nodejs", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "ruby", label: "Ruby" },
  { id: "java", label: "Java" },
  { id: "csharp", label: "C#" },
  { id: "php", label: "PHP" },
  { id: "go", label: "Go" },
];

const MIN_TITLE_LENGTH = 5;

export const Route = createFileRoute("/_auth/wiki/$articleId/")({
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `Editar Artigo ${params.articleId}`,
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { articleId } = Route.useParams();
  const numericArticleId = Number.parseInt(articleId, 10);

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
  const { theme } = useTheme();
  const { user } = usePermissions();

  const { data: categoriesData, isPending: categoriesLoading } =
    useCategories();
  const { mutateAsync: updateArticle, isPending: isUpdating } =
    useUpdateArticle();

  const [title, setTitle] = useState(article?.title ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    article?.status === "published" ? "published" : "draft",
  );
  const [categoryId, setCategoryId] = useState<number | undefined>(
    article?.category?.id ?? undefined,
  );
  const [metaDescription] = useState(article?.metaDescription ?? "");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    article?.updatedAt ? new Date(article.updatedAt) : null,
  );
  const [autoSaving, setAutoSaving] = useState(false);

  const initialTags = useMemo(
    () =>
      article?.tags?.map((tag: any) => ({
        id: String(tag.id),
        label: tag.name,
      })) ?? [],
    [article?.tags],
  );

  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTags.map((tag) => tag.id),
  );
  const [availableTags, setAvailableTags] = useState<
    { id: string; label: string }[]
  >(() => {
    const combined = [...DEFAULT_TAG_OPTIONS];
    initialTags.forEach((tag) => {
      if (!combined.find((t) => t.id === tag.id)) {
        combined.push(tag);
      }
    });
    return combined;
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    setTitle(article?.title ?? "");
    setStatus(article?.status === "published" ? "published" : "draft");
    setCategoryId(article?.category?.id ?? undefined);
    setSelectedTags(initialTags.map((tag) => tag.id));
    setAvailableTags(() => {
      const base = [...DEFAULT_TAG_OPTIONS];
      initialTags.forEach((tag) => {
        if (!base.find((t) => t.id === tag.id)) {
          base.push(tag);
        }
      });
      return base;
    });
  }, [article, initialTags]);

  const initialContent = useMemo(() => {
    const blocks = article?.content?.content;
    return Array.isArray(blocks) ? blocks : [];
  }, [article?.content?.content]);

  const editor = useCreateBlockNote({
    dictionary: {
      ...pt,
    },
    uploadFile: async (file: File) => {
      const res = await wikiApi.uploadFile(file, articleId);
      return res.data.url as string;
    },
  });

  const debouncedAutoSave = useDebouncedCallback(() => {
    if (title.trim().length < MIN_TITLE_LENGTH) return;
    setAutoSaving(true);
    handleSave(false).finally(() => setAutoSaving(false));
  }, 2000);

  useEffect(() => {
    debouncedAutoSave();

    return debouncedAutoSave.cancel;
  }, [title, debouncedAutoSave]);

  useEffect(() => {
    const unsubscribe = editor.onChange(() => {
      debouncedAutoSave();
    });

    return () => {
      unsubscribe?.();
      debouncedAutoSave.cancel();
    };
  }, [editor, debouncedAutoSave]);

  const isSaving = isUpdating;

  async function handleSave(publish = false) {
    debouncedAutoSave.cancel();

    if (title.trim().length < MIN_TITLE_LENGTH) {
      if (publish) {
        alert(`O título deve ter ao menos ${MIN_TITLE_LENGTH} caracteres.`);
      }
      return;
    }

    const content = { type: "doc", content: editor.document } as any;
    const excerpt = extractExcerptFromContent(content);

    if (publish) {
      if (!categoryId) {
        alert("Artigos publicados precisam ter uma categoria.");
        return;
      }
      const plain =
        (content as any)?.content
          ?.map?.((b: any) => b?.content?.map?.((i: any) => i?.text).join(" "))
          .join(" ") || "";
      if (plain.length < 50) {
        alert(
          "Artigos publicados precisam ter ao menos 50 caracteres de conteúdo.",
        );
        return;
      }
    }

    try {
      await updateArticle({
        id: articleId,
        data: {
          title: title.trim(),
          content,
          excerpt,
          categoryId,
          status: publish ? "published" : status,
          metaDescription: metaDescription || undefined,
        },
      } as any);
    } catch (error) {
      console.error("Erro ao salvar artigo:", error);
      alert("Não foi possível salvar o artigo. Tente novamente.");
      return;
    }

    if (publish) {
      setStatus("published");
      onPublish();
      return;
    }

    setLastSavedAt(new Date());
  }

  const handleRemoveTag = (value: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== value));
  };

  const handleSelectTag = (value: string) => {
    setSelectedTags((prev) =>
      prev.includes(value)
        ? prev.filter((tag) => tag !== value)
        : [...prev, value],
    );
  };

  const handleCreateTag = () => {
    if (!newTag.trim()) return;
    const tag = { id: newTag, label: newTag };
    setAvailableTags((prev) => [...prev, tag]);
    setSelectedTags((prev) => [...prev, tag.id]);
    setNewTag("");
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2">
            <span className="rounded-md border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {status === "published" ? "Publicado" : "Rascunho"}
            </span>
          </span>
          <span className="ml-2 flex items-center gap-1 text-xs text-zinc-500">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {autoSaving
              ? "Salvando..."
              : lastSavedAt
                ? `Salvo ${lastSavedAt.toLocaleTimeString()}`
                : "Nunca salvo"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={isSaving || title.trim().length < MIN_TITLE_LENGTH}
          >
            <Save />
            Salvar
          </Button>
          <Button
            onClick={() => handleSave(true)}
            size="sm"
            disabled={
              isSaving ||
              title.trim().length < MIN_TITLE_LENGTH ||
              status === "published"
            }
          >
            <Earth />
            Publicar
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center px-8">
        <div className="w-full max-w-3xl gap-2 border-b py-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-4xl font-bold outline-none placeholder:opacity-40"
            placeholder="Título do artigo"
          />

          <div className="mt-4 flex max-w-lg flex-col gap-x-4 gap-y-3 md:flex-row md:items-center md:gap-x-8">
            <div className="flex items-center gap-2">
              <Folder size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">em</span>

              <Select
                value={categoryId ? String(categoryId) : ""}
                onValueChange={(val) =>
                  setCategoryId(val ? Number.parseInt(val, 10) : undefined)
                }
              >
                <SelectTrigger className="h-8 w-48 border-0 p-0 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Selecionar uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Categorias</SelectLabel>
                    {categoriesLoading && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        Carregando...
                      </div>
                    )}
                    {categoriesData?.data?.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <User size={16} className="text-muted-foreground" />
              {user?.name || "Anônimo"}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Tag size={16} className="text-muted-foreground" />
            <Tags className="max-w-lg">
              <TagsTrigger className="h-8 border-0 px-1 font-normal shadow-none focus:ring-0 focus:ring-offset-0">
                {selectedTags.map((tag) => (
                  <TagsValue key={tag} onRemove={() => handleRemoveTag(tag)}>
                    {availableTags.find((t) => t.id === tag)?.label ?? tag}
                  </TagsValue>
                ))}
              </TagsTrigger>
              <TagsContent>
                <TagsInput
                  placeholder="Pesquise uma tag..."
                  onValueChange={setNewTag}
                />
                <TagsList>
                  <TagsEmpty>
                    <button
                      className="mx-auto flex cursor-pointer items-center gap-2"
                      onClick={handleCreateTag}
                      type="button"
                    >
                      <PlusIcon className="text-muted-foreground" size={14} />
                      Criar nova tag: {newTag}
                    </button>
                  </TagsEmpty>
                  <TagsGroup>
                    {availableTags.map((tag) => (
                      <TagsItem
                        key={tag.id}
                        onSelect={handleSelectTag}
                        value={tag.id}
                      >
                        {tag.label}
                        {selectedTags.includes(tag.id) && (
                          <CheckIcon
                            className="text-muted-foreground"
                            size={14}
                          />
                        )}
                      </TagsItem>
                    ))}
                  </TagsGroup>
                </TagsList>
              </TagsContent>
            </Tags>
          </div>
        </div>

        <div className="mt-4 w-full max-w-4xl px-2">
          <BlockNoteView editor={editor} theme={theme as "light" | "dark"} />
        </div>
      </div>
    </div>
  );
}

function extractExcerptFromContent(content: any): string {
  try {
    const text =
      content?.content
        ?.flatMap((b: any) =>
          (b?.content || [])
            .filter((i: any) => i?.type === "text" && i?.text)
            .map((i: any) => i.text),
        )
        ?.join(" ") || "";
    return text.slice(0, 200);
  } catch {
    return "";
  }
}
