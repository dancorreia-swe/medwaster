import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Configurações";

export const Route = createFileRoute("/_auth/admin/settings/")({
  component: RouteComponent,
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
});

function RouteComponent() {
  return <div>Hello "/_auth/admin/settings/"!</div>
}
