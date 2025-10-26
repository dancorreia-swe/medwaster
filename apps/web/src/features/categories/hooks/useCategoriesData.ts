import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesApi, categoriesListQueryOptions, categoriesQueryKeys } from "../api";

export const useCategories = (params?: { page?: number; pageSize?: number }) =>
  useQuery(categoriesListQueryOptions(params));

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: () => {
      toast.success("Categoria criada com sucesso");
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.lists() });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar categoria"
      );
    },
  });
};

export const useUpdateCategory = (options?: { silent?: boolean }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Parameters<typeof categoriesApi.updateCategory>[1]) =>
      categoriesApi.updateCategory(id, data),
    onSuccess: (_, variables) => {
      if (!options?.silent) {
        toast.success("Categoria atualizada com sucesso");
      }
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.lists() });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar categoria"
      );
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoriesApi.deleteCategory(id),
    onSuccess: (_, id) => {
      toast.success("Categoria excluída com sucesso");
      queryClient.removeQueries({ queryKey: categoriesQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.lists() });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir categoria"
      );
    },
  });
};
