import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { useUpdateArticle } from "../api/wikiQueries";
import type { BlockNoteEditor } from "@blocknote/core";
import type { TagOption } from "../components/article-tags-input";

const DEFAULT_TAG_OPTIONS: TagOption[] = [
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

interface UseArticleEditorProps {
  articleId: number;
  article: any;
  onPublish: () => void;
}

export function useArticleEditor({
  articleId,
  article,
  onPublish,
}: UseArticleEditorProps) {
  const { mutateAsync: updateArticle, isPending: isUpdating } =
    useUpdateArticle();

  const isInitialMount = useRef(true);

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
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);

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
  const [availableTags, setAvailableTags] = useState<TagOption[]>(() => {
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
    isInitialMount.current = true;
  }, [articleId]);

  useEffect(() => {
    if (isInitialMount.current && article) {
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
      isInitialMount.current = false;
    }
  }, [article, initialTags]); // Run when article data loads

  const handleSave = useCallback(
    async (publish = false) => {
      if (title.trim().length < MIN_TITLE_LENGTH) {
        if (publish) {
          alert(`O título deve ter ao menos ${MIN_TITLE_LENGTH} caracteres.`);
        }
        return;
      }

      if (!editor) {
        console.error("Editor not initialized");
        return;
      }

      try {
        await updateArticle({
          id: articleId,
          data: {
            title: title.trim(),
            content: editor.document,
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
    },
    [
      title,
      editor,
      articleId,
      categoryId,
      status,
      metaDescription,
      updateArticle,
      onPublish,
    ],
  );

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
    if (!editor) return;

    const unsubscribe = editor.onChange(() => {
      debouncedAutoSave();
    });

    return () => {
      unsubscribe?.();
      debouncedAutoSave.cancel();
    };
  }, [editor, debouncedAutoSave]);

  const handleRemoveTag = useCallback((value: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== value));
  }, []);

  const handleSelectTag = useCallback((value: string) => {
    setSelectedTags((prev) =>
      prev.includes(value)
        ? prev.filter((tag) => tag !== value)
        : [...prev, value],
    );
  }, []);

  const handleCreateTag = useCallback(() => {
    if (!newTag.trim()) return;
    const tag = { id: newTag, label: newTag };
    setAvailableTags((prev) => [...prev, tag]);
    setSelectedTags((prev) => [...prev, tag.id]);
    setNewTag("");
  }, [newTag]);

  return {
    title,
    setTitle,
    status,
    categoryId,
    setCategoryId,
    lastSavedAt,
    autoSaving,
    isUpdating,
    selectedTags,
    availableTags,
    newTag,
    setNewTag,
    editor,
    setEditor,
    handleSave,
    handleRemoveTag,
    handleSelectTag,
    handleCreateTag,
    canSave: title.trim().length >= MIN_TITLE_LENGTH,
  };
}
