import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuizDetail } from "@/features/quizzes/components/quiz-detail";
import { quizQueryOptions } from "@/features/quizzes/api/quizzesQueries";

export const Route = createFileRoute("/_auth/quizzes/$quizId/")({
  beforeLoad: () => ({ getTitle: () => "Detalhes do Quiz" }),
  loader: ({ context, params }) => {
    const quizId = Number(params.quizId);
    return context.queryClient.ensureQueryData(quizQueryOptions(quizId));
  },
  component: QuizDetailPage,
});

function QuizDetailPage() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate({ to: "/quizzes" });
  };

  return <QuizDetail quizId={Number(quizId)} onBack={handleBack} />;
}
