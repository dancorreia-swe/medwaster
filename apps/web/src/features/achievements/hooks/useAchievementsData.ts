import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { achievementsApi, type Achievement } from "../api";
import { toast } from "sonner";

export const achievementsQueryKeys = {
  all: ["achievements"] as const,
  lists: () => [...achievementsQueryKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...achievementsQueryKeys.lists(), { filters }] as const,
  details: () => [...achievementsQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...achievementsQueryKeys.details(), id] as const,
};

export const useAchievements = (params?: { page?: number; pageSize?: number }) => {
  return useQuery({
    queryKey: achievementsQueryKeys.list(params),
    queryFn: () => achievementsApi.listAchievements(params),
  });
};

export const useAchievement = (id: number) => {
  return useQuery({
    queryKey: achievementsQueryKeys.detail(id),
    queryFn: () => achievementsApi.getAchievement(id),
    enabled: !!id,
  });
};

export const useCreateAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof achievementsApi.createAchievement>[0]) =>
      achievementsApi.createAchievement(data),
    onSuccess: () => {
      toast.success("Conquista criada com sucesso");
      queryClient.invalidateQueries({ queryKey: achievementsQueryKeys.lists() });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar conquista"
      );
    },
  });
};

export const useUpdateAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof achievementsApi.updateAchievement>[1] }) =>
      achievementsApi.updateAchievement(id, data),
    onSuccess: (_, { id }) => {
      toast.success("Conquista atualizada com sucesso");
      queryClient.invalidateQueries({ queryKey: achievementsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: achievementsQueryKeys.lists() });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar conquista"
      );
    },
  });
};

export const useDeleteAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => achievementsApi.deleteAchievement(id),
    onSuccess: (_, id) => {
      toast.success("Conquista excluída com sucesso");
      queryClient.removeQueries({ queryKey: achievementsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: achievementsQueryKeys.lists() });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir conquista"
      );
    },
  });
};
