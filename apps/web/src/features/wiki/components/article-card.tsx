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
import { Link } from "@tanstack/react-router";
import {
  Archive,
  Calendar,
  Clock,
  Eye,
  FileEdit,
  FileText,
  Loader2,
  MoreVertical,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useDeleteArticle, useArchiveArticle, usePublishArticle } from "../api/wikiQueries";

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
  const deleteMutation = useDeleteArticle();
  const archiveMutation = useArchiveArticle();
  const publishMutation = usePublishArticle();

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este artigo? Esta ação não pode ser desfeita.")) return;

    try {
      await deleteMutation.mutateAsync(article.id);
      toast.success("Artigo excluído com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir artigo");
      console.error(error);
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
    <Card className="group hover:shadow-md transition-shadow gap-4">
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

      <CardContent className="space-y-3 text-sm text-slate-600 pt-0 h-full justify-center">
        <p className="line-clamp-2 text-xs min-h-10 leading-relaxed">
          {article.excerpt || "Sem resumo disponível."}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {article.readingTimeMinutes || 0}{" "}
            min
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {article.viewCount || 0}
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
        </div>
      </CardContent>

      <CardFooter className="justify-between px-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="px-0 h-8 text-blue-600 hover:text-blue-700 hover:bg-transparent"
        >
          <Link to={`/wiki/$articleId`} params={{ articleId: article.id }}>
            <FileEdit className="size-4 mr-1" /> Editar
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/wiki/$articleId`} params={{ articleId: article.id }}>
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
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-destructive focus:text-destructive"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4 text-destructive" />
              )}
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
