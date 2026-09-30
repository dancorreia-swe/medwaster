import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/profile";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Perfil do Administrador";

export const Route = createFileRoute("/_auth/admin/profile")({
  component: ProfilePage,
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad() {
    return { getTitle: () => PAGE_TITLE };
  },
});
