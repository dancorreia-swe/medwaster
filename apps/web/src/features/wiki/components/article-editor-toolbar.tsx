import { Button } from "@/components/ui/button";
import { Earth, Save } from "lucide-react";

interface ArticleEditorToolbarProps {
  status: "draft" | "published";
  isSaving: boolean;
  autoSaving: boolean;
  lastSavedAt: Date | null;
  canSave: boolean;
  onSave: () => void;
  onPublish: () => void;
}

export function ArticleEditorToolbar({
  status,
  isSaving,
  autoSaving,
  lastSavedAt,
  canSave,
  onSave,
  onPublish,
}: ArticleEditorToolbarProps) {
  return (
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
          onClick={onSave}
          disabled={isSaving || !canSave}
        >
          <Save />
          Salvar
        </Button>
        <Button
          onClick={onPublish}
          size="sm"
          disabled={isSaving || !canSave || status === "published"}
        >
          <Earth />
          Publicar
        </Button>
      </div>
    </div>
  );
}
