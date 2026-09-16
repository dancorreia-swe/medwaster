import { createFileRoute } from "@tanstack/react-router";
import { AccountSettingsPage } from "@/features/profile";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Configurações";

export const Route = createFileRoute("/_auth/admin/settings/")({
  component: AccountSettingsPage,
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
});
