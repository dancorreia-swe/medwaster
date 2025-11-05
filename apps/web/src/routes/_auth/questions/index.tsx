import { createFileRoute } from "@tanstack/react-router";
import { QuestionsPage } from "@/features/questions";
import { listQuestionsQueryOptions } from "@/features/questions/api/list-questions";

export const Route = createFileRoute("/_auth/questions/")({
  beforeLoad: () => ({ getTitle: () => "Questões" }),
  loader: ({ context }) => {
    const queryParams = {
      page: 1,
      pageSize: 20,
      sort: "modified_desc" as const,
    };
    return context.queryClient.ensureQueryData(
      listQuestionsQueryOptions(queryParams),
    );
  },
  component: QuestionsPage,
});
