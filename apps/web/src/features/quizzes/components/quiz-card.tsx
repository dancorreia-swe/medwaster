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
  Clock,
  Users,
  Trophy,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  Eye,
  BookOpen,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { QuizListItem } from "../types";

interface QuizCardProps {
  quiz: QuizListItem;
  onEdit?: (quiz: QuizListItem) => void;
  onArchive?: (quiz: QuizListItem) => void;
  onDelete?: (quiz: QuizListItem) => void;
}

const difficultyConfig = {
  basic: { label: "Básico", variant: "secondary" as const },
  intermediate: { label: "Intermediário", variant: "default" as const },
  advanced: { label: "Avançado", variant: "destructive" as const },
  mixed: { label: "Misto", variant: "outline" as const },
};

const statusConfig = {
  draft: { label: "Rascunho", variant: "secondary" as const },
  active: { label: "Ativo", variant: "default" as const },
  inactive: { label: "Inativo", variant: "outline" as const },
  archived: { label: "Arquivado", variant: "destructive" as const },
};

export function QuizCard({ quiz, onEdit, onArchive, onDelete }: QuizCardProps) {
  const difficulty = difficultyConfig[quiz.difficulty];
  const status = statusConfig[quiz.status];

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium leading-tight line-clamp-2">
            {quiz.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/quizzes/$id" params={{ id: quiz.id.toString() }}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(quiz)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onArchive?.(quiz)}>
                <Archive className="mr-2 h-4 w-4" />
                Arquivar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(quiz)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {quiz.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {quiz.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{quiz.questionCount} questões</span>
            </div>

            {quiz.timeLimit && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{quiz.timeLimit}min</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {quiz.maxAttempts && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{quiz.maxAttempts} tentativas</span>
              </div>
            )}

            {quiz.passingScore && (
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span>{quiz.passingScore}% aprovação</span>
              </div>
            )}
          </div>
        </div>

        {quiz.category && (
          <div className="pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              {quiz.category.name}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Por {quiz.author.name}</span>
            <span>{new Date(quiz.createdAt).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

