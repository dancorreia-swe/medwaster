import { createFileRoute } from "@tanstack/react-router";
import { TrailBuilderPage } from "@/features/trails/pages/trail-builder-page";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Criar Trilha";

export const Route = createFileRoute("/_auth/trails/create")({
  component: () => <TrailBuilderPage mode="create" />,
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
});
