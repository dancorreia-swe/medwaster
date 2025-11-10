import { createFileRoute } from "@tanstack/react-router";
import { TrailBuilderPage } from "@/features/trails/pages/trail-builder-page";

export const Route = createFileRoute("/_auth/trails/create")({
  component: () => <TrailBuilderPage mode="create" />,
});
