import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trailsApi } from "./trailsApi";
import type {
  TrailListQueryParams,
  CreateTrailBody,
  UpdateTrailBody,
  AddContentBody,
  UpdateContentBody,
  ReorderContentBody,
  AddPrerequisiteBody,
} from "../types";

// ===================================
// Query Options
// ===================================

export const trailsListQueryOptions = (params?: TrailListQueryParams) =>
  queryOptions({
    queryKey: ["trails", "list", params],
    queryFn: () => trailsApi.listTrails(params),
    staleTime: 1000 * 30, // 30 seconds
  });

export const trailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["trails", id],
    queryFn: () => trailsApi.getTrail(id),
    staleTime: 1000 * 60, // 1 minute
  });

// ===================================
// Mutations
// ===================================

export function useCreateTrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTrailBody) => trailsApi.createTrail(body),
    onMutate: () => {
      toast.loading("Criando trilha...", { id: "create-trail" });
    },
    onSuccess: () => {
      toast.success("Trilha criada com sucesso!", { id: "create-trail" });
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar trilha", { id: "create-trail" });
    },
  });
}

export function useUpdateTrail(options?: { silent?: boolean }) {
  const queryClient = useQueryClient();
  const silent = options?.silent ?? false;

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTrailBody }) =>
      trailsApi.updateTrail(id, body),
    onMutate: ({ body }) => {
      if (!silent) {
        // Show appropriate loading message
        if (body.unlockOrder !== undefined) {
          toast.loading("Atualizando ordem...", { id: "update-trail" });
        } else {
          toast.loading("Atualizando trilha...", { id: "update-trail" });
        }
      }
    },
    onSuccess: (_, variables) => {
      if (!silent) {
        // Show appropriate success message
        if (variables.body.unlockOrder !== undefined) {
          const order = variables.body.unlockOrder === null ? "removida" : variables.body.unlockOrder;
          toast.success(
            order === "removida"
              ? "Ordem removida com sucesso!"
              : `Ordem atualizada para #${order}!`,
            { id: "update-trail" }
          );
        } else {
          toast.success("Trilha atualizada com sucesso!", { id: "update-trail" });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
      queryClient.invalidateQueries({ queryKey: ["trails", variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar trilha", { id: "update-trail" });
    },
  });
}

export function useDeleteTrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => trailsApi.deleteTrail(id),
    onMutate: () => {
      toast.loading("Excluindo trilha...", { id: "delete-trail" });
    },
    onSuccess: () => {
      toast.success("Trilha excluída com sucesso!", { id: "delete-trail" });
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir trilha", { id: "delete-trail" });
    },
  });
}

export function usePublishTrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => trailsApi.publishTrail(id),
    onMutate: () => {
      toast.loading("Publicando trilha...", { id: "publish-trail" });
    },
    onSuccess: async (data, id) => {
      toast.success("Trilha publicada com sucesso!", { id: "publish-trail" });
      
      // Clear the cache and refetch
      queryClient.removeQueries({ queryKey: ["trails", "list"] });
      queryClient.removeQueries({ queryKey: ["trails", id] });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ 
        queryKey: ["trails", "list"],
        type: 'active'
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao publicar trilha", { id: "publish-trail" });
    },
  });
}

export function useArchiveTrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => trailsApi.archiveTrail(id),
    onMutate: () => {
      toast.loading("Arquivando trilha...", { id: "archive-trail" });
    },
    onSuccess: (_, id) => {
      toast.success("Trilha arquivada com sucesso!", { id: "archive-trail" });
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
      queryClient.invalidateQueries({ queryKey: ["trails", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao arquivar trilha", { id: "archive-trail" });
    },
  });
}

// ===================================
// Content Management Mutations
// ===================================

export function useAddContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, body }: { trailId: number; body: AddContentBody }) =>
      trailsApi.addContent(trailId, body),
    onMutate: () => {
      toast.loading("Adicionando conteúdo...", { id: "add-content" });
    },
    onSuccess: (_, variables) => {
      toast.success("Conteúdo adicionado com sucesso!", { id: "add-content" });
      queryClient.invalidateQueries({ queryKey: ["trails", variables.trailId] });
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar conteúdo", { id: "add-content" });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trailId,
      contentId,
      body,
    }: {
      trailId: number;
      contentId: number;
      body: UpdateContentBody;
    }) => trailsApi.updateContent(trailId, contentId, body),
    onMutate: () => {
      toast.loading("Atualizando conteúdo...", { id: "update-content" });
    },
    onSuccess: (_, variables) => {
      toast.success("Conteúdo atualizado com sucesso!", { id: "update-content" });
      queryClient.invalidateQueries({ queryKey: ["trails", variables.trailId] });
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar conteúdo", { id: "update-content" });
    },
  });
}

export function useRemoveContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, contentId }: { trailId: number; contentId: number }) =>
      trailsApi.removeContent(trailId, contentId),
    onMutate: () => {
      toast.loading("Removendo conteúdo...", { id: "remove-content" });
    },
    onSuccess: (_, variables) => {
      toast.success("Conteúdo removido com sucesso!", { id: "remove-content" });
      queryClient.invalidateQueries({ queryKey: ["trails", variables.trailId] });
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover conteúdo", { id: "remove-content" });
    },
  });
}

export function useReorderContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, body }: { trailId: number; body: ReorderContentBody }) =>
      trailsApi.reorderContent(trailId, body),
    onMutate: () => {
      toast.loading("Reordenando conteúdo...", { id: "reorder-content" });
    },
    onSuccess: (_, variables) => {
      toast.success("Conteúdo reordenado com sucesso!", { id: "reorder-content" });
      queryClient.invalidateQueries({ queryKey: ["trails", variables.trailId] });
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao reordenar conteúdo", { id: "reorder-content" });
    },
  });
}

// ===================================
// Prerequisites Management Mutations
// ===================================

export function useAddPrerequisite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, body }: { trailId: number; body: AddPrerequisiteBody }) =>
      trailsApi.addPrerequisite(trailId, body),
    onMutate: () => {
      toast.loading("Adicionando pré-requisito...", { id: "add-prerequisite" });
    },
    onSuccess: (_, variables) => {
      toast.success("Pré-requisito adicionado com sucesso!", { id: "add-prerequisite" });
      queryClient.invalidateQueries({ queryKey: ["trails", variables.trailId] });
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar pré-requisito", {
        id: "add-prerequisite",
      });
    },
  });
}

export function useRemovePrerequisite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trailId,
      prerequisiteId,
    }: {
      trailId: number;
      prerequisiteId: number;
    }) => trailsApi.removePrerequisite(trailId, prerequisiteId),
    onMutate: () => {
      toast.loading("Removendo pré-requisito...", { id: "remove-prerequisite" });
    },
    onSuccess: (_, variables) => {
      toast.success("Pré-requisito removido com sucesso!", { id: "remove-prerequisite" });
      queryClient.invalidateQueries({ queryKey: ["trails", variables.trailId] });
      queryClient.invalidateQueries({ queryKey: ["trails", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover pré-requisito", {
        id: "remove-prerequisite",
      });
    },
  });
}
