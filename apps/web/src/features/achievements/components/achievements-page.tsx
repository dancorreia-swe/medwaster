import { Button } from "@/components/ui/button";
import { Plus, Trophy } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAchievements } from "../hooks";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { AchievementGrid } from "./achievement-grid";
import type { Achievement } from "@server/db/schema/achievements";

export function AchievementsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useAchievements();

  const achievements = data?.data ?? [];

  const handleEdit = (achievement: Achievement) => {
    navigate({
      to: "/achievements/$achievementId",
      params: { achievementId: String(achievement.id) },
    });
  };

  const handleCreate = () => {
    navigate({
      to: "/achievements/$achievementId",
      params: { achievementId: "new" },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold">Conquistas</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Gerencie as conquistas da plataforma. Crie recompensas para
            incentivar o engajamento dos estudantes através de marcos e
            objetivos alcançáveis.
          </p>
        </header>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova conquista
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar conquistas</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Ocorreu um erro ao carregar as conquistas"}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="min-h-[400px] rounded-md border border-border bg-card">
          <Loader />
        </div>
      )}

      {!isLoading && !isError && achievements.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>Nenhuma conquista cadastrada</EmptyTitle>
            <EmptyDescription>
              Comece criando sua primeira conquista para incentivar os
              estudantes.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && !isError && achievements.length > 0 && (
        <AchievementGrid achievements={achievements} onEdit={handleEdit} />
      )}
    </div>
  );
}
