import { createFileRoute } from "@tanstack/react-router";
import { TrailsPage } from "@/features/trails/components/trails-page";
import { trailsListQueryOptions } from "@/features/trails/api/trailsQueries";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Trilhas";

export const Route = createFileRoute("/_auth/trails/")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
  loader: ({ context }) => {
    const queryParams = {
      page: 1,
      pageSize: 20,
    };
    return context.queryClient.ensureQueryData(
      trailsListQueryOptions(queryParams)
    );
  },
  component: TrailsPage,
});
