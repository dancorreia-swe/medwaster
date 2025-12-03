import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { wikiQueryKeys } from "@/features/wiki/api/wikiQueries";
import { questionsQueryKeys } from "@/features/questions/api/questionsQueries";
import { categoriesApi, categoriesListQueryOptions, categoriesQueryKeys } from "../api";
import { handleApiError, extractErrorMessage } from "@/lib/api-error-handler";

const invalidateCategoryDependentQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  options?: { skipCategoryLists?: boolean },
) => {
  if (!options?.skipCategoryLists) {
    queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.lists() });
  }

  queryClient.invalidateQueries({ queryKey: wikiQueryKeys.categories() });
  queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
  queryClient.invalidateQueries({ queryKey: questionsQueryKeys.all });
};

export const useCategories = (params?: { page?: number; pageSize?: number }) =>
  useQuery(categoriesListQueryOptions(params));

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof categoriesApi.createCategory>[0]) => {
      const response = await categoriesApi.createCategory(data);
      handleApiError(response, "Erro ao criar categoria");
      return response;
    },
    onSuccess: () => {
      toast.success("Categoria criada com sucesso");
      invalidateCategoryDependentQueries(queryClient);
    },
    onError: (error) => {
      const message = extractErrorMessage(error, "Erro ao criar categoria");
      toast.error(message);
      console.error("Error creating category:", error);
    },
  });
};

export const useUpdateCategory = (options?: { silent?: boolean; skipRefetch?: boolean }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Parameters<typeof categoriesApi.updateCategory>[1]) => {
      const response = await categoriesApi.updateCategory(id, data);
      handleApiError(response, "Erro ao atualizar categoria");
      return response;
    },
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

      const message = extractErrorMessage(error, "Erro ao atualizar categoria");
      toast.error(message);
      console.error("Error updating category:", error);
    },
    onSettled: () => {
      invalidateCategoryDependentQueries(queryClient, {
        skipCategoryLists: options?.skipRefetch,
      });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await categoriesApi.deleteCategory(id);
      handleApiError(response, "Erro ao excluir categoria");
      return response;
    },
    onSuccess: (_, id) => {
      toast.success("Categoria excluída com sucesso");
      queryClient.removeQueries({ queryKey: categoriesQueryKeys.detail(id) });
      invalidateCategoryDependentQueries(queryClient);
    },
    onError: (error) => {
      const message = extractErrorMessage(error, "Erro ao excluir categoria");
      toast.error(message);
      console.error("Error deleting category:", error);
    },
  });
};
