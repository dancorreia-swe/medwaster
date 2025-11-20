import { createFileRoute } from "@tanstack/react-router";
import { QuizBuilderPage } from "@/features/quizzes/pages/quiz-builder-page";
import { quizQueryOptions } from "@/features/quizzes/api/quizzesQueries";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Editar Quiz";

export const Route = createFileRoute("/_auth/quizzes/$quizId/edit")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
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
