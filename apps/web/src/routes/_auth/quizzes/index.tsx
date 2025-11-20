import { createFileRoute } from "@tanstack/react-router";
import { QuizzesPage } from "@/features/quizzes";
import { quizzesListQueryOptions } from "@/features/quizzes/api/quizzesQueries";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Quizzes";

export const Route = createFileRoute("/_auth/quizzes/")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
  loader: ({ context }) => {
    const queryParams = {
      page: 1,
      pageSize: 20,
    };
    return context.queryClient.ensureQueryData(
      quizzesListQueryOptions(queryParams),
    );
  },
  component: QuizzesPage,
});
