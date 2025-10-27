import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function statusBadgeColor(status?: string) {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
    case "draft":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200";
    case "archived":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
    default:
      return "";
  }
}

export function ArticleCard({ article }: { article: any }) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteArticle();
  const archiveMutation = useArchiveArticle();
  const publishMutation = usePublishArticle();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const handleCardClick = () => {
    navigate({ to: "/wiki/$articleId", params: { articleId: article.id } });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
    setConfirmationText("");
  };

  const handleConfirmDelete = async () => {
    if (confirmationText !== article.title) {
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

  const handleArchive = async () => {
    if (!confirm("Tem certeza que deseja arquivar este artigo?")) return;

    try {
      await archiveMutation.mutateAsync(article.id);
      toast.success("Artigo arquivado com sucesso");
    } catch (error) {
      toast.error("Erro ao arquivar artigo");
      console.error(error);
    }
  };

  const handlePublish = async () => {
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
            {article.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={`shrink-0 capitalize text-xs ${statusBadgeColor(article.status)}`}
          >
            {article.status === "draft"
              ? "Rascunho"
              : article.status === "published"
                ? "Publicado"
                : "Arquivado"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-slate-600 pt-0 pb-0">
        <p className="line-clamp-2 text-xs min-h-10 leading-relaxed">
          {article.excerpt || "Sem resumo disponível."}
        </p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />{" "}
              {article.readingTimeMinutes || 0} min
            </span>

            {article.updatedAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(article.updatedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            )}

            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {article.viewCount || 0}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  to={`/wiki/$articleId`}
                  params={{ articleId: article.id }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver artigo
                </Link>
              </DropdownMenuItem>

              {article.status === "published" && (
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={archiveMutation.isPending}
                >
                  {archiveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  Arquivar
                </DropdownMenuItem>
              )}

              {article.status === "draft" && (
                <DropdownMenuItem
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Publicar
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4 text-destructive" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
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
                    <strong className="text-foreground">{article.title}</strong>{" "}
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
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={
                deleteMutation.isPending || confirmationText !== article.title
              }
            >
              {deleteMutation.isPending ? (
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
