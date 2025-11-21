import { createFileRoute, redirect } from "@tanstack/react-router";
import { TeamPage } from "@/features/team";
import { buildPageHead } from "@/lib/page-title";
import { authClient } from "@/lib/auth-client";

const PAGE_TITLE = "Equipe";

export const Route = createFileRoute("/_auth/admin/team/")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();

    if (session?.user?.role !== "super-admin") {
      throw redirect({
        to: "/access-denied",
      });
    }

    return { getTitle: () => PAGE_TITLE };
  },
  component: TeamPage,
});
