import { createFileRoute } from "@tanstack/react-router";
import { QuizBuilderPage } from "@/features/quizzes/pages/quiz-builder-page";
import { quizQueryOptions } from "@/features/quizzes/api/quizzesQueries";

export const Route = createFileRoute("/_auth/quizzes/$quizId/edit")({
  beforeLoad: () => ({ getTitle: () => "Editar Quiz" }),
  loader: ({ context, params }) => {
    const quizId = Number(params.quizId);
    return context.queryClient.ensureQueryData(quizQueryOptions(quizId));
  },
  component: QuizEditPage,
});

function QuizEditPage() {
  const { quizId } = Route.useParams();

  return <QuizBuilderPage mode="edit" quizId={Number(quizId)} />;
}
