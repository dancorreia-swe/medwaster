import { createFileRoute } from "@tanstack/react-router";
import { AchievementsPage } from "@/features/achievements";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Conquistas";

export const Route = createFileRoute("/_auth/achievements/")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
  component: AchievementsPage,
});
