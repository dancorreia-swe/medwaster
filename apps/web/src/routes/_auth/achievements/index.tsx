import { createFileRoute } from "@tanstack/react-router";
import { AchievementsPage } from "@/features/achievements";

export const Route = createFileRoute("/_auth/achievements/")({
  beforeLoad: () => ({ getTitle: () => "Conquistas" }),
  component: AchievementsPage,
});
