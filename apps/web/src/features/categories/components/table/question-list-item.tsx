import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Calendar, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Category } from "../../api";

interface QuestionListItemProps {
  question: NonNullable<Category["questions"]>[number];
}

const getTypeBadge = (type: string) => {
  const badges = {
    multiple_choice: { label: "Múltipla Escolha", variant: "default" as const },
    true_false: { label: "Verdadeiro/Falso", variant: "secondary" as const },
    fill_in_blank: { label: "Preencher", variant: "outline" as const },
  };
  return badges[type as keyof typeof badges] || { label: type, variant: "default" as const };
};

const getDifficultyBadge = (difficulty: string) => {
  const badges = {
    easy: { label: "Fácil", variant: "secondary" as const },
    medium: { label: "Médio", variant: "default" as const },
    hard: { label: "Difícil", variant: "destructive" as const },
  };
  return badges[difficulty as keyof typeof badges] || { label: difficulty, variant: "default" as const };
};

export function QuestionListItem({ question }: QuestionListItemProps) {
  const typeBadge = question.type ? getTypeBadge(question.type) : null;
  const difficultyBadge = question.difficulty ? getDifficultyBadge(question.difficulty) : null;

  return (
    <Link
      to="/questions/$questionId"
      params={{ questionId: question.id.toString() }}
      className="flex items-start gap-3 bg-background rounded-md p-3 border hover:border-primary/50 transition-colors group/question relative overflow-hidden"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0 mt-0.5">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Questão</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex-1 min-w-0 w-full overflow-hidden">
        <p className="text-sm font-medium group-hover/question:text-primary transition-colors truncate">
          {question.prompt}
        </p>
        {question.explanation && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 text-wrap max-w-2/3">
            {question.explanation}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <TooltipProvider>
          {typeBadge && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge variant={typeBadge.variant} className="text-xs">
                    {typeBadge.label}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tipo de questão</p>
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
          {question.updatedAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(question.updatedAt).toLocaleDateString("pt-BR", {
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

      <div className="absolute bottom-2 right-2 opacity-0 group-hover/question:opacity-100 transition-opacity">
        <ExternalLink className="size-3 text-muted-foreground/80" />
      </div>
    </Link>
  );
}
