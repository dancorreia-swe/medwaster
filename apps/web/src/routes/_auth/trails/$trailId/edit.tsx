import { createFileRoute } from "@tanstack/react-router";
import { TrailBuilderPage } from "@/features/trails/pages/trail-builder-page";

export const Route = createFileRoute("/_auth/trails/$trailId/edit")({
  component: () => {
    const { trailId } = Route.useParams();

    return <TrailBuilderPage mode="edit" trailId={parseInt(trailId)} />;
  },
});
