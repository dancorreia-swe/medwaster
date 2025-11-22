import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { useNavigate } from "@tanstack/react-router";
import {
  MoreVertical,
  Star,
  Trash2,
  Loader2,
  AlertTriangle,
  Calendar,
  Globe,
  CheckCircle2,
  Tag,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn, stripHtml } from "@/lib/utils";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

import {
  QUESTION_DIFFICULTY_LABELS,
  QUESTION_STATUS_LABELS,
  QUESTION_TYPE_LABELS,
} from "../types";
import type { QuestionListItem } from "../types";
import { useDeleteQuestion, useUpdateQuestion } from "../api/questionsApi";
import { STATUS_OPTIONS } from "../constants";

const statusClassName: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  active: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
  archived: "bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200",
};

export function QuestionCard({ question }: { question: QuestionListItem }) {
  const navigate = useNavigate();
  const deleteQuestion = useDeleteQuestion();
  const updateQuestion = useUpdateQuestion(question.id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = () => {
    navigate({
      to: "/questions/$questionId",
      params: { questionId: question.id.toString() },
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateQuestion.mutateAsync({ status: newStatus as any });
      toast.success("Status atualizado com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error("Error updating status:", error);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteQuestion.mutateAsync(question.id);
      setShowDeleteDialog(false);
      toast.success("Questão excluída com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir questão");
      console.error("Error deleting question:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const referenceCount = Array.isArray(question.references)
    ? question.references.length
    : 0;

  return (
    <Card
      className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm line-clamp-2 flex-1 leading-relaxed font-medium group-hover:text-primary transition-colors">
            {stripHtml(question.prompt)}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`shrink-0 capitalize text-xs font-medium ${statusClassName[question.status]}`}
            >
              {QUESTION_STATUS_LABELS[question.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm pt-0 pb-4 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs font-medium">
              {QUESTION_TYPE_LABELS[question.type]}
            </Badge>
            {question.category && (
              <Badge
                variant="outline"
                className="text-xs font-medium"
                style={
                  question.category.color
                    ? {
                        backgroundColor: hexToRgba(
                          question.category.color,
                          0.08,
                        ),
                        borderColor: hexToRgba(question.category.color, 0.25),
                        color: question.category.color,
                      }
                    : undefined
                }
              >
                {question.category.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <Star
                key={index}
                size={14}
                className={cn(
                  "transition-colors",
                  index <
                    ({ basic: 1, intermediate: 2, advanced: 3 }[
                      question.difficulty
                    ] || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
            <span className="ml-2 text-xs text-muted-foreground font-medium">
              {QUESTION_DIFFICULTY_LABELS[question.difficulty]}
            </span>
          </div>

          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <Tag className="size-3 text-muted-foreground" />

              {question.tags.slice(0, 2).map(({ tag }) => (
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

              {question.tags.length > 2 && (
                <Badge
                  key="more-tags"
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  +{question.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              {question.usageCount}
            </span>

            {question.updatedAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(question.updatedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            )}

            {question.imageUrl && (
              <span
                title="Possui imagem"
                className="inline-flex items-center rounded-md py-1 text-xs gap-1"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </span>
            )}
            {referenceCount > 0 && (
              <span
                title="Referências"
                className="inline-flex items-center rounded-md py-1 text-xs gap-1"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="font-semibold text-xs">{referenceCount}</span>
              </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({
                    to: "/questions/$questionId",
                    params: { questionId: question.id.toString() },
                  });
                }}
              >
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({
                    to: "/questions/$questionId/edit",
                    params: { questionId: question.id.toString() },
                  });
                }}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Alterar Status
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent onClick={(e) => e.stopPropagation()}>
                  {STATUS_OPTIONS.map((status) => (
                    <DropdownMenuItem
                      key={status.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(status.value);
                      }}
                      disabled={question.status === status.value}
                    >
                      <div className="flex items-center gap-2">
                        {question.status === status.value && (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        <span
                          className={
                            question.status === status.value ? "" : "ml-6"
                          }
                        >
                          {status.label}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem disabled>Duplicar</DropdownMenuItem>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir questão permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription asChild className="gap-2 pt-1">
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Esta ação <strong>não pode ser desfeita</strong>. A questão
                  será permanentemente removida.
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
