import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuizDetail } from "@/features/quizzes/components/quiz-detail";
import { quizQueryOptions } from "@/features/quizzes/api/quizzesQueries";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Detalhes do Quiz";

export const Route = createFileRoute("/_auth/quizzes/$quizId/")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
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
