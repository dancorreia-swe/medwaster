import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { useNavigate } from "@tanstack/react-router";
import {
  MoreVertical,
  Star,
  Trash2,
  Loader2,
  AlertTriangle,
  Calendar,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn, stripHtml } from "@/lib/utils";
import {
  QUESTION_DIFFICULTY_LABELS,
  QUESTION_STATUS_LABELS,
  QUESTION_TYPE_LABELS,
} from "../types";
import type { QuestionListItem } from "../types";
import { useDeleteQuestion } from "../api/questionsApi";

const statusClassName: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  active: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
  archived: "bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200",
};

export function QuestionCard({ question }: { question: QuestionListItem }) {
  const navigate = useNavigate();
  const deleteQuestion = useDeleteQuestion();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = () => {
    navigate({ to: "/questions/$questionId", params: { questionId: question.id.toString() } });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
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

  return (
    <Card
      className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm line-clamp-2 flex-1 leading-relaxed font-medium group-hover:text-primary transition-colors">
            {stripHtml(question.prompt)}
          </CardTitle>
          <Badge
            variant="outline"
            className={`shrink-0 capitalize text-xs font-medium ${statusClassName[question.status]}`}
          >
            {QUESTION_STATUS_LABELS[question.status]}
          </Badge>
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
                        backgroundColor: `${question.category.color}15`,
                        borderColor: `${question.category.color}60`,
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
                    ({ basic: 1, intermediate: 2, advanced: 3 }[question.difficulty] || 0)
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
            <div className="flex flex-wrap gap-1">
              {question.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs font-medium"
                  style={
                    tag.color
                      ? {
                          backgroundColor: `${tag.color}10`,
                          borderColor: `${tag.color}40`,
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

            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                navigate({ to: "/questions/$questionId", params: { questionId: question.id.toString() } });
              }}>
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                navigate({ to: "/questions/$questionId/edit", params: { questionId: question.id.toString() } });
              }}>
                Editar
              </DropdownMenuItem>
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
                  Esta ação <strong>não pode ser desfeita</strong>. A questão será
                  permanentemente removida.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
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
