import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Earth,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SquarePen,
  MoreVertical,
  Archive,
  Undo2,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ArticleEditorToolbarProps {
  status: "draft" | "published";
  isSaving: boolean;
  autoSaving: boolean;
  lastSavedAt: Date | null;
  hasPendingChanges: boolean;
  canPublish: boolean;
  onPublish: () => void;
  onUnpublish: () => Promise<void> | void;
  onArchive: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  isUnpublishing: boolean;
  isArchiving: boolean;
  isDeleting: boolean;
  articleTitle: string;
  onBack?: () => void;
}

export function ArticleEditorToolbar({
  status,
  isSaving,
  autoSaving,
  lastSavedAt,
  hasPendingChanges,
  canPublish,
  articleTitle,
  onPublish,
  onUnpublish,
  onArchive,
  onDelete,
  isArchiving,
  isUnpublishing,
  isDeleting,
  onBack,
}: ArticleEditorToolbarProps) {
  const getRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const statusDisplay = status === "published" ? "published" : "draft";

  const STATUS_BADGE_META = {
    published: {
      className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
      icon: Earth,
      srLabel: "Artigo publicado",
      tooltip: "Este artigo está publicado. Novas mudanças precisam ser salvas para entrarem no ar.",
    },
    draft: {
      className: "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200",
      icon: SquarePen,
      srLabel: "Artigo em rascunho",
      tooltip: "Rascunho privado. Publique quando estiver pronto para o público.",
    },
  } as const;

  const statusBadge = STATUS_BADGE_META[statusDisplay];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resolveSaveState = () => {
    if (autoSaving) return "saving" as const;
    if (hasPendingChanges) return "pending" as const;
    if (lastSavedAt) return "saved" as const;
    return "never" as const;
  };

  const saveState = resolveSaveState();

  type SaveState = "saving" | "pending" | "saved" | "never";
  type SaveBadgeConfig = {
    icon: typeof Loader2;
    iconProps?: Record<string, string>;
    srLabel: string;
    tooltip: string;
  };

  const SAVE_BADGE_META: Record<
    SaveState,
    (context: { lastSavedAt: Date | null }) => SaveBadgeConfig
  > = {
    saving: () => ({
      icon: Loader2,
      iconProps: { className: "h-3 w-3 animate-spin" },
      srLabel: "Salvando alterações",
      tooltip: "Salvando alterações...",
    }),
    pending: ({ lastSavedAt }) => ({
      icon: AlertCircle,
      iconProps: { className: "h-3 w-3 text-amber-500" },
      srLabel: "Alterações pendentes",
      tooltip: lastSavedAt
        ? `Existem alterações não salvas desde ${lastSavedAt.toLocaleString(
            "pt-BR",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          )}.`
        : "Existem alterações que ainda não foram salvas.",
    }),
    saved: ({ lastSavedAt }) => ({
      icon: CheckCircle2,
      iconProps: { className: "h-3 w-3 text-green-600" },
      srLabel: "Salvo",
      tooltip: `Última modificação: ${lastSavedAt!.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} (${getRelativeTime(lastSavedAt!)})`,
    }),
    never: () => ({
      icon: AlertCircle,
      iconProps: { className: "h-3 w-3 text-muted-foreground" },
      srLabel: "Nunca salvo",
      tooltip: "Este artigo ainda não foi salvo",
    }),
  };

  const saveBadge = SAVE_BADGE_META[saveState]({ lastSavedAt });
  const showPublishAction = statusDisplay === "draft";

  return (
    <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-8 py-3">
        <TooltipProvider>
          <div className="flex items-center gap-3">
            {onBack ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onBack}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Voltar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Voltar</p>
                </TooltipContent>
              </Tooltip>
            ) : null}

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={statusDisplay === "published" ? "default" : "secondary"}
                  className={`p-1 ${statusBadge.className}`}
                >
                  <statusBadge.icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">{statusBadge.srLabel}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{statusBadge.tooltip}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-help p-1">
                  <saveBadge.icon {...saveBadge.iconProps} aria-hidden />
                  <span className="sr-only">{saveBadge.srLabel}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{saveBadge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="flex items-center gap-2">
          {showPublishAction ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      onClick={onPublish}
                      size="sm"
                      disabled={isSaving || !canPublish}
                      className="gap-2"
                    >
                      <Earth className="h-4 w-4" />
                      Publicar
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">
                    {canPublish
                      ? "Publique quando o conteúdo estiver pronto para os alunos."
                      : "Adicione um título válido e selecione uma categoria para publicar."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Mais ações"
                disabled={isSaving || isArchiving || isUnpublishing || isDeleting}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusDisplay === "published" && (
                <DropdownMenuItem
                  disabled={isUnpublishing}
                  onSelect={onUnpublish}
                  className="gap-2"
                >
                  {isUnpublishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Undo2 className="h-4 w-4" />
                  )}
                  Despublicar
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                disabled={isArchiving}
                onSelect={onArchive}
                className="gap-2"
              >
                {isArchiving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                Arquivar
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onSelect={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O artigo{" "}
              <strong className="text-foreground">{articleTitle || "sem título"}</strong>{" "}
              será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await onDelete();
                  setDeleteDialogOpen(false);
                } catch (error) {
                  console.error("Delete action failed", error);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir definitivamente
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
