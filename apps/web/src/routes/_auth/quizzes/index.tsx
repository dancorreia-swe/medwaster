import { createFileRoute } from "@tanstack/react-router";
import { QuizzesPage } from "@/features/quizzes";
import { quizzesListQueryOptions } from "@/features/quizzes/api/quizzesQueries";

export const Route = createFileRoute("/_auth/quizzes/")({
  beforeLoad: () => ({ getTitle: () => "Quizzes" }),
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