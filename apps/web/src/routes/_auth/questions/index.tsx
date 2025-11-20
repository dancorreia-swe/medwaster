import { createFileRoute } from "@tanstack/react-router";
import { QuestionsPage } from "@/features/questions";
import { listQuestionsQueryOptions } from "@/features/questions/api/list-questions";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Questões";

export const Route = createFileRoute("/_auth/questions/")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
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
