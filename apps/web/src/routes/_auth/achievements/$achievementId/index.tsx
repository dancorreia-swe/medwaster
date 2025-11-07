import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AchievementForm } from "@/features/achievements/components/achievement-form";
import { achievementQueryOptions } from "@/features/achievements/api/achievementQueries";

export const Route = createFileRoute("/_auth/achievements/$achievementId/")({
  loader: async ({ context: { queryClient }, params: { achievementId } }) => {
    if (achievementId === "new") {
      return null;
    }

    const numericAchievementId = Number(achievementId);
    if (Number.isNaN(numericAchievementId)) {
      throw new Error("Invalid achievement ID");
    }

    await queryClient.ensureQueryData(
      achievementQueryOptions(numericAchievementId)
    );
  },
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () =>
      params.achievementId === "new"
        ? "Nova Conquista"
        : `Editar Conquista ${params.achievementId}`,
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { achievementId } = Route.useParams();

  const isNew = achievementId === "new";
  const numericAchievementId = isNew ? undefined : Number(achievementId);

  if (!isNew && Number.isNaN(numericAchievementId)) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center">
        <div className="text-sm text-destructive">ID da conquista inválido.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center px-8">
        <div className="w-full">
          <AchievementForm
            achievementId={numericAchievementId}
            onSuccess={() => navigate({ to: "/achievements" })}
            onCancel={() => navigate({ to: "/achievements" })}
          />
        </div>
      </div>
    </div>
  );
}
