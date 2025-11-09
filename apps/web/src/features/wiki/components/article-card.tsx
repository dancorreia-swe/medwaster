import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  Calendar,
  Clock,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Trash2,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  useDeleteArticle,
  useArchiveArticle,
  usePublishArticle,
} from "../api/wikiQueries";

type ArticleStatus = "draft" | "published" | "archived";

export interface ArticleCardArticle {
  id: number;
  title?: string | null;
  status?: ArticleStatus | null;
  excerpt?: string | null;
  readingTimeMinutes?: number | null;
  updatedAt?: string | null;
  viewCount?: number | null;
}

interface ArticleCardProps {
  article: ArticleCardArticle;
}

const STATUS_META = {
  published: {
    label: "Publicado",
    badgeClass:
      "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  },
  draft: {
    label: "Rascunho",
    badgeClass:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  },
  archived: {
    label: "Arquivado",
    badgeClass: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
  },
} as const;

const FALLBACK_STATUS_META = {
  label: "Desconhecido",
  badgeClass: "bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200",
};

const DEFAULT_EXCERPT = "Sem resumo disponível.";

export function ArticleCard({ article }: ArticleCardProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteArticle();
  const archiveMutation = useArchiveArticle();
  const publishMutation = usePublishArticle();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const displayTitle =
    article.title && article.title.trim().length > 0
      ? article.title
      : "Sem título";
  const deleteTarget = article.title ?? displayTitle;
  const statusValue = article.status ?? undefined;
  const statusMeta =
    statusValue && statusValue in STATUS_META
      ? STATUS_META[statusValue as keyof typeof STATUS_META]
      : FALLBACK_STATUS_META;
  const excerpt =
    article.excerpt && article.excerpt.trim().length > 0
      ? article.excerpt
      : DEFAULT_EXCERPT;
  const readingTime = article.readingTimeMinutes ?? 0;
  const lastUpdated = article.updatedAt
    ? new Date(article.updatedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    : null;
  const viewCount = article.viewCount ?? 0;

  const isDeleting = deleteMutation.isPending;
  const isArchiving = archiveMutation.isPending;
  const isPublishing = publishMutation.isPending;
  const isDeleteDisabled =
    isDeleting || confirmationText.trim() !== deleteTarget;
  const canArchive = statusValue === "draft" || statusValue === "published";
  const canPublish = statusValue === "draft" || statusValue === "archived";

  const handleCardClick = () => {
    navigate({
      to: "/wiki/$articleId",
      params: { articleId: String(article.id) },
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
    setConfirmationText("");
  };

  const handleConfirmDelete = async () => {
    if (confirmationText.trim() !== deleteTarget) {
      toast.error("O nome do artigo não corresponde");
      return;
    }

    try {
      await deleteMutation.mutateAsync(article.id);
      setShowDeleteDialog(false);
      toast.success("Artigo excluído com sucesso");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir artigo",
      );
    }
  };

  const handleArchiveClick = () => {
    setShowArchiveDialog(true);
  };

  const handleConfirmArchive = async () => {
    if (isArchiving) return;

    try {
      await archiveMutation.mutateAsync(article.id);
      toast.success("Artigo arquivado com sucesso");
    } catch (error) {
      toast.error("Erro ao arquivar artigo");
      console.error(error);
    } finally {
      setShowArchiveDialog(false);
    }
  };

  const handlePublish = async () => {
    if (isPublishing) return;

    try {
      await publishMutation.mutateAsync(article.id);
      toast.success("Artigo publicado com sucesso");
    } catch (error) {
      toast.error("Erro ao publicar artigo");
      console.error(error);
    }
  };

  return (
    <Card
      className="group hover:shadow-md transition-shadow gap-4 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2 flex-1 leading-snug">
            {displayTitle}
          </CardTitle>
          <Badge
            variant="outline"
            className={`shrink-0 capitalize text-xs ${statusMeta.badgeClass}`}
          >
            {statusMeta.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-slate-600 pt-0 pb-0">
        <p className="line-clamp-2 text-xs min-h-10 leading-relaxed">
          {excerpt}
        </p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {readingTime} min
            </span>

            {lastUpdated && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {lastUpdated}
              </span>
            )}

            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {viewCount}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem asChild>
                <Link
                  to={`/wiki/$articleId`}
                  params={{ articleId: String(article.id) }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver artigo
                </Link>
              </DropdownMenuItem>

              {canArchive && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchiveClick();
                  }}
                  disabled={isArchiving}
                >
                  {isArchiving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  Arquivar
                </DropdownMenuItem>
              )}

              {canPublish && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePublish();
                  }}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Publicar
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4 text-destructive" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove "{displayTitle}" das listas visíveis, mas você pode
              encontrá-lo novamente na aba de artigos arquivados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="secondary"
              onClick={handleConfirmArchive}
              disabled={isArchiving}
            >
              {isArchiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Arquivando...
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Confirmar arquivamento
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir artigo permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription asChild className="gap-2 pt-1">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Esta ação <strong>não pode ser desfeita</strong>. O artigo e
                  todos os seus dados relacionados (tags, favoritos, progresso
                  de leitura) serão permanentemente removidos.
                </p>
                <div className="space-y-2 pt-1">
                  <Label htmlFor="confirm-title">
                    Digite{" "}
                    <strong className="text-foreground">{deleteTarget}</strong>{" "}
                    para confirmar:
                  </Label>
                  <Input
                    id="confirm-title"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Digite o nome do artigo"
                    className="placeholder:font-normal font-semibold"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleteDisabled}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir permanentemente
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
