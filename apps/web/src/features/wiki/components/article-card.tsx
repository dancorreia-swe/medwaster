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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";
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
  Tag,
  Folder,
  FileX,
  ExternalLink,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import {
  useDeleteArticle,
  useArchiveArticle,
  usePublishArticle,
  useUnpublishArticle,
  useUpdateArticle,
  useCategories,
} from "../api/wikiQueries";
import { ExternalArticleFormDialog } from "./external-article-form-dialog";

type ArticleStatus = "draft" | "published" | "archived";

export interface ArticleCardArticle {
  id: number;
  title?: string | null;
  icon?: string | null;
  status?: ArticleStatus | null;
  sourceType?: "original" | "external" | null;
  externalUrl?: string | null;
  externalAuthors?: string[] | null;
  publicationSource?: string | null;
  publicationDate?: string | null;
  excerpt?: string | null;
  readingTimeMinutes?: number | null;
  updatedAt?: string | null;
  viewCount?: number | null;
  category?: {
    id: number;
    name: string;
    color?: string | null;
  } | null;
  tags?: Array<{
    id: number;
    name: string;
    color?: string | null;
  }>;
}

interface ArticleCardProps {
  article: ArticleCardArticle;
}

const STATUS_META = {
  published: {
    label: "Publicado",
    badgeClass:
      "bg-green-100 text-green-800 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-800 dark:hover:bg-green-900/40",
  },
  draft: {
    label: "Rascunho",
    badgeClass:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/50",
  },
  archived: {
    label: "Arquivado",
    badgeClass:
      "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200 dark:bg-gray-900/40 dark:text-gray-100 dark:border-gray-800 dark:hover:bg-gray-900/50",
  },
} as const;

const FALLBACK_STATUS_META = {
  label: "Desconhecido",
  badgeClass:
    "bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200 dark:bg-slate-900/40 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-900/50",
};

const DEFAULT_EXCERPT = "Sem resumo disponível.";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteArticle();
  const archiveMutation = useArchiveArticle();
  const publishMutation = usePublishArticle();
  const unpublishMutation = useUnpublishArticle();
  const updateMutation = useUpdateArticle();
  const { data: categoriesData } = useCategories();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const isInteractingRef = useRef(false);

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
  const isUnpublishing = unpublishMutation.isPending;
  const isDeleteDisabled =
    isDeleting || confirmationText.trim() !== deleteTarget;
  const canArchive = statusValue === "draft" || statusValue === "published";
  const canPublish = statusValue === "draft" || statusValue === "archived";
  const canUnpublish = statusValue === "published";

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if any dialog is open or if we're in the middle of an interaction
    if (
      showEditDialog ||
      showDeleteDialog ||
      showArchiveDialog ||
      showUnpublishDialog ||
      showEmojiPicker ||
      isInteractingRef.current
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (article.sourceType === "external" && article.externalUrl) {
      window.open(article.externalUrl, "_blank");
    } else {
      navigate({
        to: "/wiki/$articleId",
        params: { articleId: String(article.id) },
      });
    }
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
      console.error("Archive error:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao arquivar artigo",
      );
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
      console.error("Publish error:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao publicar artigo",
      );
    }
  };

  const handleUnpublishClick = () => {
    setShowUnpublishDialog(true);
  };

  const handleConfirmUnpublish = async () => {
    if (isUnpublishing) return;

    try {
      await unpublishMutation.mutateAsync(article.id);
      toast.success("Artigo despublicado com sucesso");
    } catch (error) {
      console.error("Unpublish error:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao despublicar artigo",
      );
    } finally {
      setShowUnpublishDialog(false);
    }
  };

  const handleIconChange = async (emoji: string) => {
    try {
      await updateMutation.mutateAsync({
        id: article.id,
        data: { icon: emoji },
      });
      setShowEmojiPicker(false);
      toast.success("Ícone atualizado");
    } catch (error) {
      console.error("Icon update error:", error);
      toast.error("Erro ao atualizar ícone");
    }
  };

  const handleEditSubmit = async (values: any) => {
    try {
      await updateMutation.mutateAsync({
        id: article.id,
        data: values,
      });
      setShowEditDialog(false);
      toast.success("Artigo atualizado com sucesso");
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar artigo",
      );
    }
  };

  const categoriesList = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData?.data ?? []);

  const handleEditDialogChange = (open: boolean) => {
    // When closing the dialog, mark that we're interacting BEFORE state changes
    // to prevent card clicks from backdrop clicks
    if (!open) {
      isInteractingRef.current = true;
    }
    setShowEditDialog(open);
    if (!open) {
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 100);
    }
  };

  return (
    <Card
      className="group hover:shadow-md transition-shadow gap-4 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start gap-3 min-w-0">
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto hover:bg-muted rounded transition-colors shrink-0 mt-0.5"
              >
                {article.icon ? (
                  <span className="text-xl">{article.icon}</span>
                ) : (
                  <FileText className="size-5 text-muted-foreground" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-fit p-0"
              align="start"
              onClick={(e) => e.stopPropagation()}
            >
              <EmojiPicker
                locale="pt"
                className="h-[342px]"
                onEmojiSelect={({ emoji }) => handleIconChange(emoji)}
              >
                <EmojiPickerSearch placeholder="Pesquisar..." />
                <EmojiPickerContent />
                <EmojiPickerFooter />
              </EmojiPicker>
            </PopoverContent>
          </Popover>
          <CardTitle className="text-base line-clamp-2 flex-1 leading-normal wrap-break-word">
            {displayTitle}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`w-fit capitalize text-xs ${statusMeta.badgeClass}`}
          >
            {statusMeta.label}
          </Badge>
          {article.sourceType === "external" && (
            <Badge
              variant="outline"
              className="w-fit text-xs bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:text-purple-100 dark:border-purple-800 dark:hover:bg-purple-900/40"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Externo
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-muted-foreground pt-0 pb-0">
        <p className="line-clamp-2 text-xs min-h-10 leading-relaxed">
          {excerpt}
        </p>

        <div className="space-y-2">
          {article.category && (
            <div className="flex items-center gap-1">
              <Folder className="size-3 text-muted-foreground" />
              <Badge
                variant="outline"
                className="text-xs dark:border-slate-700 dark:text-slate-100"
              >
                {article.category.name}
              </Badge>
            </div>
          )}
          
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <Tag className="size-3 text-muted-foreground" />
              {article.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs font-medium"
                  style={
                    tag.color
                      ? {
                          backgroundColor: hexToRgba(tag.color, 0.06),
                          borderColor: hexToRgba(tag.color, 0.25),
                          color: tag.color,
                        }
                      : undefined
                  }
                >
                  {tag.name}
                </Badge>
              ))}
              
              {article.tags.length > 2 && (
                <Badge 
                  variant="outline" 
                  className="text-xs text-muted-foreground dark:border-slate-700"
                >
                  +{article.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
              <DropdownMenuItem
                asChild={article.sourceType !== "external"}
                disabled={article.sourceType === "external"}
              >
                {article.sourceType === "external" ? (
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver artigo
                  </div>
                ) : (
                  <Link
                    to={`/wiki/$articleId`}
                    params={{ articleId: String(article.id) }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver artigo
                  </Link>
                )}
              </DropdownMenuItem>

              {article.sourceType === "external" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}

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

              {canUnpublish && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnpublishClick();
                  }}
                  disabled={isUnpublishing}
                >
                  {isUnpublishing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileX className="mr-2 h-4 w-4" />
                  )}
                  Despublicar
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

      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Despublicar artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              O artigo "{displayTitle}" será removido da visualização pública e voltará
              para o status de rascunho. Você poderá republicá-lo a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnpublishing}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmUnpublish}
              disabled={isUnpublishing}
            >
              {isUnpublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Despublicando...
                </>
              ) : (
                <>
                  <FileX className="mr-2 h-4 w-4" />
                  Confirmar despublicação
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
                  <Label
                    htmlFor="confirm-title"
                    className="select-auto cursor-text gap-1"
                  >
                    Digite{" "}
                    <span className="text-foreground px-0 m-0">
                      {deleteTarget}
                    </span>{" "}
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

      <ExternalArticleFormDialog
        open={showEditDialog}
        onOpenChange={handleEditDialogChange}
        article={
          article.sourceType === "external"
            ? {
                id: article.id,
                title: article.title || "",
                externalUrl: article.externalUrl || "",
                externalAuthors: article.externalAuthors || [],
                publicationSource: article.publicationSource,
                publicationDate: article.publicationDate,
                excerpt: article.excerpt,
                categoryId: article.category?.id,
                icon: article.icon,
                tags: article.tags,
              }
            : null
        }
        categories={categoriesList}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </Card>
  );
}
