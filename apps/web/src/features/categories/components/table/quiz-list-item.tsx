import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClipboardList, Calendar, ExternalLink, Clock, Target } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Category } from "../../api";

interface QuizListItemProps {
  quiz: NonNullable<Category["quizzes"]>[number];
}

const getStatusBadge = (status: string) => {
  const badges = {
    draft: { label: "Rascunho", variant: "secondary" as const },
    active: { label: "Ativo", variant: "default" as const },
    archived: { label: "Arquivado", variant: "outline" as const },
  };
  return badges[status as keyof typeof badges] || { label: status, variant: "default" as const };
};

const getDifficultyBadge = (difficulty: string) => {
  const badges = {
    easy: { label: "Fácil", variant: "secondary" as const },
    medium: { label: "Médio", variant: "default" as const },
    hard: { label: "Difícil", variant: "destructive" as const },
  };
  return badges[difficulty as keyof typeof badges] || { label: difficulty, variant: "default" as const };
};

export function QuizListItem({ quiz }: QuizListItemProps) {
  const statusBadge = quiz.status ? getStatusBadge(quiz.status) : null;
  const difficultyBadge = quiz.difficulty ? getDifficultyBadge(quiz.difficulty) : null;

  return (
    <Link
      to="/quizzes/$quizId"
      params={{ quizId: quiz.id.toString() }}
      className="flex items-start gap-3 bg-background rounded-md p-3 border hover:border-primary/50 transition-colors group/quiz relative overflow-hidden"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0 mt-0.5">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Quiz</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex-1 min-w-0 w-full overflow-hidden">
        <p className="text-sm font-medium group-hover/quiz:text-primary transition-colors truncate">
          {quiz.title}
        </p>
        {quiz.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 text-wrap max-w-2/3">
            {quiz.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <TooltipProvider>
          {statusBadge && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge variant={statusBadge.variant} className="text-xs">
                    {statusBadge.label}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Status</p>
              </TooltipContent>
            </Tooltip>
          )}
          {difficultyBadge && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge variant={difficultyBadge.variant} className="text-xs">
                    {difficultyBadge.label}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dificuldade</p>
              </TooltipContent>
            </Tooltip>
          )}
          {quiz.timeLimit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{quiz.timeLimit}min</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tempo limite</p>
              </TooltipContent>
            </Tooltip>
          )}
          {quiz.passingScore != null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                  <Target className="h-3.5 w-3.5" />
                  <span>{quiz.passingScore}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nota de aprovação</p>
              </TooltipContent>
            </Tooltip>
          )}
          {quiz.updatedAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(quiz.updatedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Última atualização</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>

      <div className="absolute bottom-2 right-2 opacity-0 group-hover/quiz:opacity-100 transition-opacity">
        <ExternalLink className="size-3 text-muted-foreground/80" />
      </div>
    </Link>
  );
}
