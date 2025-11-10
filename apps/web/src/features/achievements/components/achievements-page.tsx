import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trophy } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAchievements } from "../hooks";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { AchievementGrid } from "./achievement-grid";
import { AchievementOrderManager } from "./achievement-order-manager";
import { achievementsApi } from "../api/achievementsApi";
import type { Achievement } from "@server/db/schema/achievements";

export function AchievementsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useAchievements();

  const achievements = data?.data ?? [];
  const orderedAchievements = useMemo(() => {
    return [...achievements].sort((a, b) => {
      const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
      if (aOrder === bOrder) {
        return a.name.localeCompare(b.name);
      }
      return aOrder - bOrder;
    });
  }, [achievements]);

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      achievementsApi.updateAchievement(id, body),
    onMutate: ({ body }) => {
      if (body.displayOrder !== undefined) {
        toast.loading("Atualizando ordem...", { id: "update-achievement" });
      }
    },
    onSuccess: (_, variables) => {
      if (variables.body.displayOrder !== undefined) {
        toast.success(`Ordem atualizada para #${variables.body.displayOrder}!`, {
          id: "update-achievement",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar conquista", {
        id: "update-achievement",
      });
    },
  });

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

  const handleBulkReorder = async (reordered: Achievement[]) => {
    try {
      toast.loading("Salvando nova ordem...", { id: "achievements-reorder" });

      const updates = reordered.map((achievement, index) =>
        updateMutation.mutateAsync({
          id: achievement.id,
          body: { displayOrder: index + 1 },
        }),
      );

      await Promise.all(updates);
      await queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast.success("Ordem das conquistas atualizada!", {
        id: "achievements-reorder",
      });
    } catch (error) {
      console.error("Error updating achievement order:", error);
      toast.error("Erro ao atualizar ordem das conquistas", {
        id: "achievements-reorder",
      });
    }
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
        <div className="flex items-center gap-2">
          {orderedAchievements.length > 1 && (
            <AchievementOrderManager
              achievements={orderedAchievements}
              onSave={handleBulkReorder}
            />
          )}
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova conquista
          </Button>
        </div>
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

      {!isLoading && !isError && orderedAchievements.length === 0 && (
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

      {!isLoading && !isError && orderedAchievements.length > 0 && (
        <AchievementGrid
          achievements={orderedAchievements}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
