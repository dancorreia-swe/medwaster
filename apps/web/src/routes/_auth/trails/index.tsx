import { createFileRoute } from "@tanstack/react-router";
import { TrailsPage } from "@/features/trails/components/trails-page";
import { trailsListQueryOptions } from "@/features/trails/api/trailsQueries";

export const Route = createFileRoute("/_auth/trails/")({
  beforeLoad: () => ({ getTitle: () => "Trilhas" }),
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
