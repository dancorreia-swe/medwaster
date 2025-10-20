import { useEffect, useState, useCallback, useRef } from "react";
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

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

export function useArticleEditor({
  articleId,
  article,
  onPublish,
}: UseArticleEditorProps) {
  const { mutateAsync: updateArticle, isPending: isUpdating } = useUpdateArticle();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>(DEFAULT_TAG_OPTIONS);
  const [newTag, setNewTag] = useState("");

  // Track initial values from server to detect actual changes
  const serverState = useRef({
    title: "",
    categoryId: undefined as number | undefined,
    selectedTags: [] as string[],
  });

  // Initialize state from article data once per article
  useEffect(() => {
    if (!article) return;
    
    const newTitle = article.title ?? "";
    const newStatus = article.status === "published" ? "published" : "draft";
    const newCategoryId = article.category?.id;
    const newLastSavedAt = article.updatedAt ? new Date(article.updatedAt) : null;

    setTitle(newTitle);
    setStatus(newStatus);
    setCategoryId(newCategoryId);
    setLastSavedAt(newLastSavedAt);

    const articleTags = article.tags?.map((tag: any) => ({
      id: String(tag.id),
      label: tag.name,
    })) ?? [];

    const newSelectedTags = articleTags.map((tag: TagOption) => tag.id);
    setSelectedTags(newSelectedTags);
    
    const combined = [...DEFAULT_TAG_OPTIONS];
    articleTags.forEach((tag: TagOption) => {
      if (!combined.find((t) => t.id === tag.id)) {
        combined.push(tag);
      }
    });
    setAvailableTags(combined);

    // Store server state
    serverState.current = {
      title: newTitle,
      categoryId: newCategoryId,
      selectedTags: newSelectedTags,
    };
  }, [articleId, article]);

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
            metaDescription: undefined,
          },
        } as any);

        if (publish) {
          setStatus("published");
          onPublish();
        } else {
          setLastSavedAt(new Date());
          serverState.current = {
            title: title.trim(),
            categoryId,
            selectedTags,
          };
        }
      } catch (error) {
        console.error("Erro ao salvar artigo:", error);
        alert("Não foi possível salvar o artigo. Tente novamente.");
      }
    },
    [title, editor, articleId, categoryId, selectedTags, status, updateArticle, onPublish],
  );

  const debouncedAutoSave = useDebouncedCallback(() => {
    if (title.trim().length < MIN_TITLE_LENGTH) return;
    setAutoSaving(true);
    handleSave(false).finally(() => setAutoSaving(false));
  }, 2000);

  // Check if current state differs from server state
  const hasChanges = useCallback(() => {
    return (
      title !== serverState.current.title ||
      categoryId !== serverState.current.categoryId ||
      !arraysEqual(selectedTags, serverState.current.selectedTags)
    );
  }, [title, categoryId, selectedTags]);

  // Auto-save on changes (only if different from server state)
  useEffect(() => {
    if (!hasChanges()) return;
    debouncedAutoSave();
    return debouncedAutoSave.cancel;
  }, [title, categoryId, selectedTags, hasChanges, debouncedAutoSave]);

  const handleEditorChange = useCallback(() => {
    // Editor changes are always considered changes
    debouncedAutoSave();
  }, [debouncedAutoSave]);

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
    handleEditorChange,
    canSave: title.trim().length >= MIN_TITLE_LENGTH,
  };
}
