import { createFileRoute } from "@tanstack/react-router";
import { TrailBuilderPage } from "@/features/trails/pages/trail-builder-page";
import { buildPageHead } from "@/lib/page-title";

export const Route = createFileRoute("/_auth/trails/$trailId/edit")({
  head: ({ params }) => buildPageHead(`Editar Trilha ${params.trailId}`),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || undefined,
    };
  },
  beforeLoad: ({ params }) => ({
    getTitle: () => `Editar Trilha ${params.trailId}`,
  }),
  component: () => {
    const { trailId } = Route.useParams();
    const { tab } = Route.useSearch();

    return <TrailBuilderPage mode="edit" trailId={parseInt(trailId)} initialTab={tab} />;
  },
});
