import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { treaty } from "@elysiajs/eden";
import type { App } from "@server/index";
import { wikiApi } from "./wikiApi";

const api = treaty<App>(import.meta.env.VITE_SERVER_URL || "http://localhost:3000");

export const useWikiStats = () => {
  return useQuery({
    queryKey: ["wiki", "stats"],
    queryFn: async () => api.wiki.articles.stats.get(),
    staleTime: 60 * 1000,
  });
};

// Query keys for consistent caching
export const wikiQueryKeys = {
  all: ["wiki"] as const,
  articles: () => [...wikiQueryKeys.all, "articles"] as const,
  articlesList: (filters?: any) => [...wikiQueryKeys.articles(), "list", filters] as const,
  article: (id: number) => [...wikiQueryKeys.articles(), "detail", id] as const,
  files: () => [...wikiQueryKeys.all, "files"] as const,
  filesList: (filters?: any) => [...wikiQueryKeys.files(), "list", filters] as const,
  categories: () => [...wikiQueryKeys.all, "categories"] as const,
  tags: () => [...wikiQueryKeys.all, "tags"] as const,
};

// Article queries
export const useArticles = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: number;
  authorId?: string;
  search?: string;
  sort?: string;
  order?: string;
}) => {
  return useQuery({
    queryKey: wikiQueryKeys.articlesList(params),
    queryFn: () => wikiApi.articles.list(params),
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000,
  });
};

export const useArticle = (id: number) => {
  return useQuery({
    queryKey: wikiQueryKeys.article(id),
    queryFn: () => wikiApi.articles.get(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Article mutations
export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: wikiApi.articles.create,
    onSuccess: (data, variables) => {
      // Invalidate articles list to refetch
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.articles(),
      });

      // Optimistically add the new article to the cache
      queryClient.setQueryData(
        wikiQueryKeys.article(data.data.id),
        data
      );
    },
    onError: (error) => {
      console.error("Failed to create article:", error);
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      wikiApi.articles.update(id, data),
    onSuccess: (data, { id }) => {
      // Update the specific article in cache
      queryClient.setQueryData(
        wikiQueryKeys.article(id),
        data
      );

      // Invalidate articles list to refetch
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.articles(),
      });
    },
    onError: (error) => {
      console.error("Failed to update article:", error);
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wikiApi.articles.delete(id),
    onSuccess: (data, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: wikiQueryKeys.article(id),
      });

      // Invalidate articles list
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.articles(),
      });
    },
    onError: (error) => {
      console.error("Failed to delete article:", error);
    },
  });
};

export const usePublishArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wikiApi.articles.publish(id),
    onSuccess: (data, id) => {
      // Update the article cache with new status
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.article(id),
      });

      // Invalidate articles list
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.articles(),
      });
    },
    onError: (error) => {
      console.error("Failed to publish article:", error);
    },
  });
};

export const useUnpublishArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wikiApi.articles.unpublish(id),
    onSuccess: (data, id) => {
      // Update the article cache
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.article(id),
      });

      // Invalidate articles list
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.articles(),
      });
    },
  });
};

// File queries
export const useFiles = (params?: {
  page?: number;
  limit?: number;
  articleId?: number;
  mimeType?: string;
}) => {
  return useQuery({
    queryKey: wikiQueryKeys.filesList(params),
    queryFn: () => wikiApi.files.list(params),
    staleTime: 5 * 60 * 1000,
  });
};

// File mutations
export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, articleId }: { file: File; articleId?: number }) =>
      wikiApi.files.upload(file, articleId),
    onSuccess: () => {
      // Invalidate files list to refetch
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.files(),
      });
    },
    onError: (error) => {
      console.error("Failed to upload file:", error);
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wikiApi.files.delete(id),
    onSuccess: () => {
      // Invalidate files list
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.files(),
      });
    },
    onError: (error) => {
      console.error("Failed to delete file:", error);
    },
  });
};

// Categories and tags
export const useCategories = () => {
  return useQuery({
    queryKey: wikiQueryKeys.categories(),
    queryFn: () => wikiApi.categories.list(),
    staleTime: 30 * 60 * 1000, // 30 minutes (categories don't change often)
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useTags = () => {
  return useQuery({
    queryKey: wikiQueryKeys.tags(),
    queryFn: () => wikiApi.tags.list(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

// Bulk operations
export const useBulkArticleOperations = () => {
  const queryClient = useQueryClient();

  const publishMultiple = useMutation({
    mutationFn: async (articleIds: number[]) => {
      return Promise.all(articleIds.map(id => wikiApi.articles.publish(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.articles(),
      });
    },
  });

  const unpublishMultiple = useMutation({
    mutationFn: async (articleIds: number[]) => {
      return Promise.all(articleIds.map(id => wikiApi.articles.unpublish(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.articles(),
      });
    },
  });

  const deleteMultiple = useMutation({
    mutationFn: async (articleIds: number[]) => {
      return Promise.all(articleIds.map(id => wikiApi.articles.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wikiQueryKeys.articles(),
      });
    },
  });

  const exportMultiple = useMutation({
    mutationFn: (data: {
      articleIds: number[];
      includeImages?: boolean;
      format?: "A4" | "Letter";
      title?: string;
    }) => wikiApi.articles.bulkExportPdf(data),
  });

  return {
    publishMultiple,
    unpublishMultiple,
    deleteMultiple,
    exportMultiple,
  };
};

// Export operations
export const useExportArticle = () => {
  return useMutation({
    mutationFn: ({ id, options }: {
      id: number;
      options?: { includeImages?: boolean; format?: "A4" | "Letter" };
    }) => wikiApi.articles.exportPdf(id, options),
    onError: (error) => {
      console.error("Failed to export article:", error);
    },
  });
};

// Auto-save hook for article editing
export const useAutoSaveArticle = (articleId?: number, debounceMs = 3000) => {
  const updateMutation = useUpdateArticle();
  const createMutation = useCreateArticle();

  const autoSave = React.useCallback(
    async (data: any) => {
      try {
        if (articleId) {
          await updateMutation.mutateAsync({ id: articleId, data });
        } else {
          await createMutation.mutateAsync(data);
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    },
    [articleId, updateMutation, createMutation]
  );

  // Debounced version of auto-save
  const debouncedAutoSave = React.useMemo(
    () => debounce(autoSave, debounceMs),
    [autoSave, debounceMs]
  );

  return {
    autoSave: debouncedAutoSave,
    isAutoSaving: updateMutation.isPending || createMutation.isPending,
    autoSaveError: updateMutation.error || createMutation.error,
  };
};

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default {
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
