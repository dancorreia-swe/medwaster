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

export const useUpdateCategory = (options?: { silent?: boolean; skipRefetch?: boolean }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Parameters<typeof categoriesApi.updateCategory>[1]) =>
      categoriesApi.updateCategory(id, data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: categoriesQueryKeys.lists() });
      
      const previousCategories = queryClient.getQueriesData({ queryKey: categoriesQueryKeys.lists() });

      queryClient.setQueriesData(
        { queryKey: categoriesQueryKeys.lists() },
        (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data?.map((category: any) =>
              category.id === variables.id
                ? { ...category, ...variables }
                : category
            ),
          };
        }
      );

      return { previousCategories };
    },
    onSuccess: (_, variables) => {
      if (!options?.silent) {
        toast.success("Categoria atualizada com sucesso");
      }
    },
    onError: (error, _, context) => {
      if (context?.previousCategories) {
        context.previousCategories.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar categoria"
      );
    },
    onSettled: (_, __, variables) => {
      if (!options?.skipRefetch) {
        queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.lists() });
      }
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
