import { useEffect, useState, useCallback, useRef } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { useUpdateArticle } from "../api/wikiQueries";
import type { BlockNoteEditor } from "@blocknote/core";

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
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Track initial values from server to detect actual changes
  const serverState = useRef({
    title: "",
    categoryId: undefined as number | undefined,
    selectedTags: [] as number[],
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

    // Extract tag IDs from article
    const newSelectedTags = article.tags?.map((tag: any) => tag.id) ?? [];
    setSelectedTags(newSelectedTags);

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
            tagIds: selectedTags,
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

  const handleUploadFile = useCallback(async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/admin/wiki/files/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      return result.data.url;
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error("Failed to upload file");
    }
  }, []);

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
    setSelectedTags,
    editor,
    setEditor,
    handleSave,
    handleEditorChange,
    handleUploadFile,
    canSave: title.trim().length >= MIN_TITLE_LENGTH,
  };
}
