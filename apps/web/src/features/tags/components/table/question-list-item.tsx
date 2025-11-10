import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { FileQuestion } from "lucide-react";

interface QuestionListItemProps {
  question: {
    id: number;
    prompt: string;
    explanation?: string | null;
    type: string;
    difficulty: string;
    status: string;
    updatedAt: Date | string;
  };
}

const typeLabels: Record<string, string> = {
  multiple_choice: "Múltipla Escolha",
  true_false: "Verdadeiro/Falso",
  fill_in_blank: "Preencher Lacuna",
  matching: "Correspondência",
};

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export function QuestionListItem({ question }: QuestionListItemProps) {
  return (
    <Link
      to="/questions/$questionId"
      params={{ questionId: question.id.toString() }}
      className="group flex items-center gap-3 rounded-lg border bg-background p-3 transition-all hover:border-primary hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
        <FileQuestion className="h-5 w-5" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
            {question.prompt}
          </h4>
        </div>
        {question.explanation && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {question.explanation}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {typeLabels[question.type] || question.type}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {difficultyLabels[question.difficulty] || question.difficulty}
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDate(question.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
