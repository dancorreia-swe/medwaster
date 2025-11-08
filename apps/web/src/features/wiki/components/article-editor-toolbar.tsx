import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Earth, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  onPublish,
}: ArticleEditorToolbarProps) {
  const getRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  return (
    <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <Badge
            variant={status === "published" ? "default" : "secondary"}
            className={
              status === "published"
                ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200"
            }
          >
            {status === "published" ? "Publicado" : "Rascunho"}
          </Badge>

          {/* Save Status Badge with Tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="cursor-help gap-1.5"
                >
                  {autoSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : lastSavedAt ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span>Salvo</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Não salvo</span>
                    </>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {autoSaving
                    ? "Salvando alterações..."
                    : lastSavedAt
                      ? `Última modificação: ${lastSavedAt.toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} (${getRelativeTime(lastSavedAt)})`
                      : "Este artigo ainda não foi salvo"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-3">
          {/* Publish Button */}
          <Button
            onClick={onPublish}
            size="sm"
            disabled={isSaving || !canSave || status === "published"}
            className="gap-2"
          >
            <Earth className="h-4 w-4" />
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
}
