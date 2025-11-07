import type { QuizListItem } from "../types";
import { QuizCard } from "./quiz-card";

interface QuizzesGridProps {
  quizzes: QuizListItem[];
  onEdit?: (quiz: QuizListItem) => void;
  onArchive?: (quiz: QuizListItem) => void;
  onDelete?: (quiz: QuizListItem) => void;
}

export function QuizzesGrid({ quizzes, onEdit, onArchive, onDelete }: QuizzesGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {quizzes.map((quiz) => (
        <QuizCard
          key={quiz.id}
          quiz={quiz}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}