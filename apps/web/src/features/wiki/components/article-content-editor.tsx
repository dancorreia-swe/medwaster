import { useTheme } from "@/components/theme-provider";
import { BlockNoteView } from "@blocknote/shadcn";
import { BlockNoteEditor } from "@blocknote/core";
import { pt } from "@blocknote/core/locales";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { useEffect, useRef, useMemo } from "react";

interface ArticleContentEditorProps {
  initialContent?: any[];
  onUploadFile: (file: File) => Promise<string>;
  onEditorReady?: (editor: BlockNoteEditor) => void;
  articleId?: number; // Add articleId to track article changes
}

export function ArticleContentEditor({
  initialContent,
  onUploadFile,
  onEditorReady,
  articleId,
}: ArticleContentEditorProps) {
  const { theme } = useTheme();
  const previousArticleId = useRef<number | null>(null);

  const editor = useMemo(() => {
    // Track that we're creating editor for this article
    previousArticleId.current = articleId ?? null;
    
    return BlockNoteEditor.create({
      dictionary: {
        ...pt,
      },
      uploadFile: onUploadFile,
      initialContent: initialContent || undefined,
    });
  }, [articleId]); // Only recreate when articleId changes

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) {
    return (
      <div className="mt-4 w-full max-w-4xl px-2">
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Carregando editor...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full max-w-4xl px-2">
      <BlockNoteView editor={editor} theme={theme as "light" | "dark"} />
    </div>
  );
}
