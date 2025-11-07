import { createFileRoute } from "@tanstack/react-router";
import { QuizBuilderPage } from "@/features/quizzes/pages/quiz-builder-page";

export const Route = createFileRoute("/_auth/quizzes/create")({
  component: () => <QuizBuilderPage mode="create" />,
});