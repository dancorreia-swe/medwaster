import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const useWikiStats = () =>
  useQuery({
    queryKey: wikiQueryKeys.stats(),
    queryFn: wikiApi.getStats,
    staleTime: 60_000,
  });

type ArticleListQueryParams = import("./wikiApi").ArticleListQueryParams;
type FileListQueryParams = import("./wikiApi").FileListQueryParams;

type UpdateArticleInput = Parameters<typeof wikiApi.updateArticle>[1];
type CreateArticleInput = Parameters<typeof wikiApi.createArticle>[0];
type BulkExportInput = Parameters<typeof wikiApi.bulkExportPdf>[0];
type ExportPdfInput = Parameters<typeof wikiApi.exportArticlePdf>[1];

export const useArticles = (filters?: ArticleListQueryParams) =>
  useQuery({
    queryKey: wikiQueryKeys.articlesList(filters),
    queryFn: () => wikiApi.listArticles(filters),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

export const useArticle = (id: number) =>
  useQuery({
    queryKey: wikiQueryKeys.article(id),
    queryFn: () => wikiApi.getArticle(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 5 * 60_000,
  });

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: wikiApi.createArticle,
    onSuccess: (response) => {
      const created = response?.data?.data;

      if (created?.id) {
        queryClient.setQueryData(wikiQueryKeys.article(created.id), response);
      }
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log(data);

      return await client.wiki.articles({ id }).put({
        title: data?.title,
        content: data?.content,
      });
    },
    onSuccess: (response, variables) => {
      queryClient.setQueryData(wikiQueryKeys.article(variables.id), response);
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
    onError: (error) => {
      console.error("Error updating article:", error);
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wikiApi.deleteArticle(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: wikiQueryKeys.article(id) });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
  });
};

export const usePublishArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wikiApi.publishArticle(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.article(id) });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
  });
};

export const useUnpublishArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wikiApi.unpublishArticle(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.article(id) });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    },
  });
};

export const useFiles = (filters?: FileListQueryParams) =>
  useQuery({
    queryKey: wikiQueryKeys.filesList(filters),
    queryFn: () => wikiApi.listFiles(filters),
    staleTime: 5 * 60_000,
  });

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, articleId }: { file: File; articleId?: number }) =>
      wikiApi.uploadFile(file, articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.files() });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wikiApi.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.files() });
    },
  });
};

export const useCategories = () =>
  useQuery({
    queryKey: wikiQueryKeys.categories(),
    queryFn: wikiApi.listCategories,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });

export const useTags = () =>
  useQuery({
    queryKey: wikiQueryKeys.tags(),
    queryFn: wikiApi.listTags,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });

export const useBulkArticleOperations = () => {
  const queryClient = useQueryClient();

  const invalidateArticles = () => {
    queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
  };

  const publishMultiple = useMutation({
    mutationFn: (articleIds: number[]) =>
      Promise.all(articleIds.map((id) => wikiApi.publishArticle(id))),
    onSuccess: invalidateArticles,
  });

  const unpublishMultiple = useMutation({
    mutationFn: (articleIds: number[]) =>
      Promise.all(articleIds.map((id) => wikiApi.unpublishArticle(id))),
    onSuccess: invalidateArticles,
  });

  const deleteMultiple = useMutation({
    mutationFn: (articleIds: number[]) =>
      Promise.all(articleIds.map((id) => wikiApi.deleteArticle(id))),
    onSuccess: invalidateArticles,
  });

  const exportMultiple = useMutation({
    mutationFn: (input: BulkExportInput) => wikiApi.bulkExportPdf(input),
  });

  return {
    publishMultiple,
    unpublishMultiple,
    deleteMultiple,
    exportMultiple,
  };
};

export const useExportArticle = () =>
  useMutation({
    mutationFn: ({ id, options }: { id: number; options?: ExportPdfInput }) =>
      wikiApi.exportArticlePdf(id, options),
  });

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
  useFiles,
  useUploadFile,
  useDeleteFile,
  useCategories,
  useTags,
  useBulkArticleOperations,
  useExportArticle,
  useAutoSaveArticle,
};
