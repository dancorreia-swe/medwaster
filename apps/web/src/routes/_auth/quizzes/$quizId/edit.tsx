import { createFileRoute } from "@tanstack/react-router";
import { QuizBuilderPage } from "@/features/quizzes/pages/quiz-builder-page";

export const Route = createFileRoute("/_auth/quizzes/$quizId/edit")({
  component: () => {
    const { quizId } = Route.useParams();
    return <QuizBuilderPage mode="edit" quizId={Number(quizId)} />;
  },
});