import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { wikiApi } from "./wikiApi";
import { client } from "@/lib/client";

export const wikiQueryKeys = {
  all: ["wiki"] as const,
  stats: () => [...wikiQueryKeys.all, "stats"] as const,
  articles: () => [...wikiQueryKeys.all, "articles"] as const,
  articlesList: (filters?: unknown) =>
    [...wikiQueryKeys.articles(), "list", filters] as const,
  article: (id: number) => [...wikiQueryKeys.articles(), "detail", id] as const,
  files: () => [...wikiQueryKeys.all, "files"] as const,
  filesList: (filters?: unknown) =>
    [...wikiQueryKeys.files(), "list", filters] as const,
  categories: () => [...wikiQueryKeys.all, "categories"] as const,
  tags: () => [...wikiQueryKeys.all, "tags"] as const,
};

export const wikiStatsQueryOptions = () =>
  queryOptions({
    queryKey: wikiQueryKeys.stats(),
    queryFn: wikiApi.getStats,
    staleTime: 60_000,
  });

export const useWikiStats = () => useQuery(wikiStatsQueryOptions());

type ArticleListQueryParams = import("./wikiApi").ArticleListQueryParams;

type UpdateArticleInput = Parameters<typeof wikiApi.updateArticle>[1];
type CreateArticleInput = Parameters<typeof wikiApi.createArticle>[0];

export const articlesQueryOptions = (filters?: ArticleListQueryParams) =>
  queryOptions({
    queryKey: wikiQueryKeys.articlesList(filters),
    queryFn: () => wikiApi.listArticles(filters),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

export const useArticles = (filters?: ArticleListQueryParams) =>
  useQuery(articlesQueryOptions(filters));

export const articleQueryOptions = (id: number) =>
  queryOptions({
    queryKey: wikiQueryKeys.article(id),
    queryFn: () => wikiApi.getArticle(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 5 * 60_000,
  });

export const useArticle = (id: number) => useQuery(articleQueryOptions(id));

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: wikiQueryKeys.categories(),
    queryFn: wikiApi.listCategories,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });

export const useCategories = () => useQuery(categoriesQueryOptions());

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: wikiApi.createArticle,
    onSuccess: (response, variables) => {
      const created = response?.data?.data;
      const isExternal =
        created?.sourceType === "external" ||
        (variables as CreateArticleInput)?.sourceType === "external";

      if (created?.id) {
        queryClient.setQueryData(wikiQueryKeys.article(created.id), response);
      }

      if (isExternal) {
        // External articles stay on the list view after creation, so refresh it
        queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
      }

      // Don't invalidate articles list here for internal articles - let the editor page do it if needed
      // This prevents the list from updating before navigation
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateArticleInput;
    }) => {
      const response = await client.admin.wiki.articles({ id }).put(data);
      if (
        response &&
        typeof response === "object" &&
        "error" in response &&
        response.error
      ) {
        const errorDetail = (response as any).error;
        const errorValue = (errorDetail as any)?.value;
        const message =
          typeof errorDetail === "string"
            ? errorDetail
            : typeof errorValue === "string"
              ? errorValue
              : (errorValue?.error?.message ??
                 errorValue?.message ??
                 (errorDetail as any)?.message ??
                 "Erro ao atualizar artigo.");
        throw new Error(String(message));
      }
      return response;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: wikiQueryKeys.article(id) });

      const previousArticle = queryClient.getQueryData(
        wikiQueryKeys.article(id),
      );

      queryClient.setQueryData(wikiQueryKeys.article(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...data,
            updatedAt: new Date().toISOString(),
          },
        };
      });

      return { previousArticle };
    },
    onSuccess: (response, variables) => {
      queryClient.setQueryData(wikiQueryKeys.article(variables.id), response);
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
    onError: (error, variables, context) => {
      if (context?.previousArticle) {
        queryClient.setQueryData(
          wikiQueryKeys.article(variables.id),
          context.previousArticle,
        );
      }
      console.error("Error updating article:", error);
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await wikiApi.deleteArticle(id);
      if (response.error) {
        const errorDetail = response.error;
        const errorValue = (errorDetail as any)?.value;
        const message =
          typeof errorDetail === "string"
            ? errorDetail
            : typeof errorValue === "string"
              ? errorValue
              : (errorValue?.error?.message ??
                 errorValue?.message ??
                 (errorDetail as any)?.message ??
                 "Erro ao excluir artigo.");
        throw new Error(String(message));
      }
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the specific article query first
      queryClient.removeQueries({ queryKey: wikiQueryKeys.article(id) });
      // Then invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
    },
  });
};

export const useArchiveArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await wikiApi.archiveArticle(id);
      if (response.error) {
        const errorDetail = response.error;
        const errorValue = (errorDetail as any)?.value;
        const message =
          typeof errorDetail === "string"
            ? errorDetail
            : typeof errorValue === "string"
              ? errorValue
              : (errorValue?.error?.message ??
                 errorValue?.message ??
                 (errorDetail as any)?.message ??
                 "Erro ao arquivar artigo.");
        throw new Error(String(message));
      }
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.article(id) });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
  });
};

export const usePublishArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await wikiApi.publishArticle(id);
      if (response.error) {
        const errorDetail = response.error;
        const errorValue = (errorDetail as any)?.value;
        const message =
          typeof errorDetail === "string"
            ? errorDetail
            : typeof errorValue === "string"
              ? errorValue
              : (errorValue?.error?.message ??
                 errorValue?.message ??
                 (errorDetail as any)?.message ??
                 "Erro ao publicar artigo.");
        throw new Error(String(message));
      }
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.article(id) });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
  });
};

export const useUnpublishArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await wikiApi.unpublishArticle(id);
      if (response.error) {
        const errorDetail = response.error;
        const errorValue = (errorDetail as any)?.value;
        const message =
          typeof errorDetail === "string"
            ? errorDetail
            : typeof errorValue === "string"
              ? errorValue
              : (errorValue?.error?.message ??
                 errorValue?.message ??
                 (errorDetail as any)?.message ??
                 "Erro ao despublicar artigo.");
        throw new Error(String(message));
      }
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.article(id) });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
  });
};

export const useSearchTags = (search?: string) =>
  useQuery({
    queryKey: [...wikiQueryKeys.tags(), search] as const,
    queryFn: () => wikiApi.listTags({ search }),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
    enabled: true,
  });

export const useTags = () =>
  useQuery({
    queryKey: wikiQueryKeys.tags(),
    queryFn: () => wikiApi.listTags(),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: wikiApi.createTag,
    onSuccess: (response) => {
      // Invalidate all tag queries to refetch with the new tag
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.tags() });
      // Also invalidate tags page queries for cross-page synchronization
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error) => {
      console.error("Error creating tag:", error);
    },
  });
};

export const useBulkArticleOperations = () => {
  const queryClient = useQueryClient();

  const invalidateArticles = () => {
    queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
  };

  const publishMultiple = useMutation({
    mutationFn: async (articleIds: number[]) => {
      const responses = await Promise.all(
        articleIds.map((id) => wikiApi.publishArticle(id)),
      );
      const errors = responses.filter((r: any) => r.error);
      if (errors.length > 0) {
        const errorDetail = errors[0].error;
        const errorValue = (errorDetail as any)?.value;
        const message =
          typeof errorDetail === "string"
            ? errorDetail
            : typeof errorValue === "string"
              ? errorValue
              : (errorValue?.error?.message ??
                 errorValue?.message ??
                 (errorDetail as any)?.message ??
                 "Erro ao publicar alguns artigos.");
        throw new Error(String(message));
      }
      return responses;
    },
    onSuccess: invalidateArticles,
  });

  const unpublishMultiple = useMutation({
    mutationFn: async (articleIds: number[]) => {
      const responses = await Promise.all(
        articleIds.map((id) => wikiApi.unpublishArticle(id)),
      );
      const errors = responses.filter((r: any) => r.error);
      if (errors.length > 0) {
        const errorDetail = errors[0].error;
        const errorValue = (errorDetail as any)?.value;
        const message =
          typeof errorDetail === "string"
            ? errorDetail
            : typeof errorValue === "string"
              ? errorValue
              : (errorValue?.error?.message ??
                 errorValue?.message ??
                 (errorDetail as any)?.message ??
                 "Erro ao despublicar alguns artigos.");
        throw new Error(String(message));
      }
      return responses;
    },
    onSuccess: invalidateArticles,
  });

  const deleteMultiple = useMutation({
    mutationFn: async (articleIds: number[]) => {
      const responses = await Promise.all(
        articleIds.map((id) => wikiApi.deleteArticle(id)),
      );
      const errors = responses.filter((r: any) => r.error);
      if (errors.length > 0) {
        const errorDetail = errors[0].error;
        const errorValue = (errorDetail as any)?.value;
        const message =
          typeof errorDetail === "string"
            ? errorDetail
            : typeof errorValue === "string"
              ? errorValue
              : (errorValue?.error?.message ??
                 errorValue?.message ??
                 (errorDetail as any)?.message ??
                 "Erro ao excluir alguns artigos.");
        throw new Error(String(message));
      }
      return responses;
    },
    onSuccess: invalidateArticles,
  });

  return {
    publishMultiple,
    unpublishMultiple,
    deleteMultiple,
  };
};

export const useAutoSaveArticle = (articleId?: number, debounceMs = 3000) => {
  const updateMutation = useUpdateArticle();
  const createMutation = useCreateArticle();

  const run = useCallback(
    async (data: UpdateArticleInput | CreateArticleInput) => {
      if (articleId) {
        await updateMutation.mutateAsync({
          id: articleId,
          data: data as UpdateArticleInput,
        });

        return;
      }
      await createMutation.mutateAsync(data as CreateArticleInput);
    },
    [articleId, updateMutation, createMutation],
  );

  const debounced = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return (payload: UpdateArticleInput | CreateArticleInput) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => run(payload), debounceMs);
    };
  }, [run, debounceMs]);

  return {
    autoSave: debounced,
    isAutoSaving: updateMutation.isPending || createMutation.isPending,
    autoSaveError: updateMutation.error || createMutation.error,
  };
};

export default {
  useWikiStats,
  useArticles,
  useArticle,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  usePublishArticle,
  useUnpublishArticle,
  useCategories,
  useTags,
  useBulkArticleOperations,
  useAutoSaveArticle,
};
