import { createFileRoute } from "@tanstack/react-router";
import { TrailBuilderPage } from "@/features/trails/pages/trail-builder-page";

export const Route = createFileRoute("/_auth/trails/$trailId/edit")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || undefined,
    };
  },
  component: () => {
    const { trailId } = Route.useParams();
    const { tab } = Route.useSearch();

    return <TrailBuilderPage mode="edit" trailId={parseInt(trailId)} initialTab={tab} />;
  },
});
