import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
  keepPreviousData,
  useInfiniteQuery,
  infiniteQueryOptions,
} from "@tanstack/react-query";
import { wikiApi } from "./wikiApi";
import { client } from "@/lib/client";

const ERROR_MESSAGES: Record<string, string> = {
  // Business Logic Errors
  NEED_CATEGORY:
    "É necessário selecionar uma categoria para publicar o artigo.",
  BUSINESS_LOGIC_ERROR: "Erro de regra de negócio.",
  DEPENDENCY_ERROR:
    "Este recurso não pode ser modificado pois está em uso por outros recursos.",

  // Validation Errors
  VALIDATION_ERROR: "Erro de validação. Verifique os dados e tente novamente.",
  UNPROCESSABLE_ENTITY: "Os dados fornecidos são inválidos.",
  BAD_REQUEST: "Requisição inválida. Verifique os dados enviados.",

  // Auth Errors
  UNAUTHORIZED: "Você não tem permissão para realizar esta ação.",
  FORBIDDEN: "Acesso negado.",

  // Resource Errors
  NOT_FOUND: "Recurso não encontrado.",
  CONFLICT: "Este recurso já existe ou há um conflito.",

  // Server Errors
  INTERNAL_SERVER_ERROR: "Erro interno do servidor. Tente novamente mais tarde.",
  SERVICE_UNAVAILABLE: "Serviço temporariamente indisponível.",
  DATABASE_ERROR: "Erro ao acessar o banco de dados.",

  // Rate Limiting
  TOO_MANY_REQUESTS: "Muitas requisições. Aguarde alguns instantes.",
};

/**
 * Checks if an API response contains an error
 */
const isErrorResponse = (response: any): boolean => {
  return response?.error !== undefined && response?.error !== null;
};

/**
 * Translates validation field names to Portuguese
 */
const translateFieldName = (field: string): string => {
  const fieldTranslations: Record<string, string> = {
    title: "título",
    content: "conteúdo",
    excerpt: "resumo",
    categoryId: "categoria",
    tagIds: "tags",
    featuredImageUrl: "imagem de destaque",
    status: "status",
    externalUrl: "URL externa",
    externalAuthors: "autores",
    publicationDate: "data de publicação",
    publicationSource: "fonte de publicação",
    readingTimeMinutes: "tempo de leitura",
    icon: "ícone",
    sourceType: "tipo de fonte",
  };

  return fieldTranslations[field] || field;
};

/**
 * Formats validation error message in Portuguese
 */
const formatValidationError = (details: any): string | null => {
  if (!details) return null;

  // Handle multiple validation errors
  if (details.allErrors && Array.isArray(details.allErrors)) {
    const messages = details.allErrors.map((err: any) => {
      const field = translateFieldName(err.field);
      return `• ${field}: ${err.message}`;
    });
    return `Erros de validação:\n${messages.join("\n")}`;
  }

  // Single validation error
  if (!details.field) return null;

  const field = translateFieldName(details.field);
  const constraints = details.constraints || {};

  // Handle different validation types based on constraints
  if (constraints.minLength !== undefined && constraints.maxLength !== undefined) {
    return `O campo "${field}" deve ter entre ${constraints.minLength} e ${constraints.maxLength} caracteres.`;
  }

  if (constraints.minLength !== undefined) {
    return `O campo "${field}" deve ter no mínimo ${constraints.minLength} caracteres.`;
  }

  if (constraints.maxLength !== undefined) {
    return `O campo "${field}" deve ter no máximo ${constraints.maxLength} caracteres.`;
  }

  if (constraints.minimum !== undefined && constraints.maximum !== undefined) {
    return `O campo "${field}" deve estar entre ${constraints.minimum} e ${constraints.maximum}.`;
  }

  if (constraints.minimum !== undefined) {
    return `O campo "${field}" deve ser no mínimo ${constraints.minimum}.`;
  }

  if (constraints.maximum !== undefined) {
    return `O campo "${field}" deve ser no máximo ${constraints.maximum}.`;
  }

  if (constraints.pattern) {
    return `O campo "${field}" está em formato inválido.`;
  }

  // Check the error message for specific patterns
  const message = details.message?.toLowerCase() || "";

  if (message.includes("required")) {
    return `O campo "${field}" é obrigatório.`;
  }

  if (message.includes("string") || message.includes("number") || message.includes("boolean")) {
    return `O campo "${field}" está em formato inválido.`;
  }

  // Use the backend message if available, otherwise generic message
  if (details.message) {
    return `${field}: ${details.message}`;
  }

  return `O campo "${field}" é inválido.`;
};

/**
 * Extracts error message from API response
 * Handles the standardized backend error format
 */
const getErrorMessage = (responseError: any, defaultMessage: string): string => {
  // Handle null/undefined
  if (!responseError) return defaultMessage;

  // Handle string errors
  if (typeof responseError === "string") return responseError;

  // Extract error object from response
  // Backend format: { success: false, error: { code, message, details } }
  const errorValue = responseError?.value;
  const errorData = errorValue?.error || errorValue;

  // Get error code
  const code = errorData?.code || responseError?.code;

  // Handle validation errors with detailed field information
  if (code === "VALIDATION_ERROR" && errorData?.details) {
    const validationMessage = formatValidationError(errorData.details);
    if (validationMessage) return validationMessage;
  }

  // Handle specific error codes with custom messages
  if (code === "DEPENDENCY_ERROR") {
    const dependencies = errorData?.details?.dependencies;
    if (Array.isArray(dependencies) && dependencies.length > 0) {
      return `Não é possível realizar esta ação pois o artigo está em uso nas seguintes trilhas: ${dependencies.join(", ")}.`;
    }
  }

  // Use predefined error message if available
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Try to extract message from various possible locations
  const extractedMessage =
    errorData?.message ||
    errorValue?.message ||
    responseError?.message;

  return extractedMessage || defaultMessage;
};

/**
 * Handles API errors by checking response and throwing an error with a user-friendly message
 */
const handleApiError = (response: any, defaultMessage: string): void => {
  if (isErrorResponse(response)) {
    const message = getErrorMessage(response.error, defaultMessage);
    throw new Error(message);
  }
};

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

export const articlesInfiniteQueryOptions = (
  filters?: Omit<ArticleListQueryParams, "page">
) =>
  infiniteQueryOptions({
    queryKey: [...wikiQueryKeys.articles(), "infinite", filters] as const,
    queryFn: ({ pageParam = 1 }) =>
      wikiApi.listArticles({ ...filters, page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const response = lastPage?.data?.data;
      if (!response) return undefined;

      const { currentPage, totalPages } = response.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

export const useArticlesInfinite = (
  filters?: Omit<ArticleListQueryParams, "page">
) => useInfiniteQuery(articlesInfiniteQueryOptions(filters));

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
    mutationFn: async (data: CreateArticleInput) => {
      const response = await wikiApi.createArticle(data);
      handleApiError(response, "Erro ao criar artigo.");
      return response;
    },
    onSuccess: (response, variables) => {
      const created = response?.data?.data;
      const isExternal =
        created?.sourceType === "external" ||
        variables?.sourceType === "external";

      if (created?.id) {
        queryClient.setQueryData(wikiQueryKeys.article(created.id), response);
      }

      // Don't invalidate queries here - will be done after navigation
      // to avoid empty list issue when going back without changes
    },
    onError: (error) => {
      console.error("Error creating article:", error);
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
      const response = await wikiApi.updateArticle(id, data);
      handleApiError(response, "Erro ao atualizar artigo.");
      return response;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: wikiQueryKeys.article(id) });

      const previousArticle = queryClient.getQueryData(
        wikiQueryKeys.article(id),
      );

      // Optimistically update the article
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
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats() });
    },
    onError: (error, variables, context) => {
      // Rollback to previous value on error
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
      handleApiError(response, "Erro ao excluir artigo.");
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the specific article query first
      queryClient.removeQueries({ queryKey: wikiQueryKeys.article(id) });
      // Then invalidate the list and stats to refetch
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats() });
    },
    onError: (error) => {
      console.error("Error deleting article:", error);
    },
  });
};

export const useArchiveArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await wikiApi.archiveArticle(id);
      handleApiError(response, "Erro ao arquivar artigo.");
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.article(id) });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats() });
    },
    onError: (error) => {
      console.error("Error archiving article:", error);
    },
  });
};

export const usePublishArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await wikiApi.publishArticle(id);
      handleApiError(response, "Erro ao publicar artigo.");
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.article(id) });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats() });
    },
    onError: (error) => {
      console.error("Error publishing article:", error);
    },
  });
};

export const useUnpublishArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await wikiApi.unpublishArticle(id);
      handleApiError(response, "Erro ao despublicar artigo.");
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.article(id) });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats() });
    },
    onError: (error) => {
      console.error("Error unpublishing article:", error);
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
    mutationFn: async (data: Parameters<typeof wikiApi.createTag>[0]) => {
      const response = await wikiApi.createTag(data);
      // Note: wikiApi.createTag returns response.data directly
      return response;
    },
    onSuccess: () => {
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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: wikiQueryKeys.articles() });
    queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats() });
  };

  const publishMultiple = useMutation({
    mutationFn: async (articleIds: number[]) => {
      const responses = await Promise.all(
        articleIds.map((id) => wikiApi.publishArticle(id)),
      );

      // Check for errors and collect them
      const errors = responses.filter((r: any) => isErrorResponse(r));
      if (errors.length > 0) {
        handleApiError(errors[0], "Erro ao publicar alguns artigos.");
      }

      return responses;
    },
    onSuccess: invalidateAll,
    onError: (error) => {
      console.error("Error publishing multiple articles:", error);
    },
  });

  const unpublishMultiple = useMutation({
    mutationFn: async (articleIds: number[]) => {
      const responses = await Promise.all(
        articleIds.map((id) => wikiApi.unpublishArticle(id)),
      );

      // Check for errors and collect them
      const errors = responses.filter((r: any) => isErrorResponse(r));
      if (errors.length > 0) {
        handleApiError(errors[0], "Erro ao despublicar alguns artigos.");
      }

      return responses;
    },
    onSuccess: invalidateAll,
    onError: (error) => {
      console.error("Error unpublishing multiple articles:", error);
    },
  });

  const deleteMultiple = useMutation({
    mutationFn: async (articleIds: number[]) => {
      const responses = await Promise.all(
        articleIds.map((id) => wikiApi.deleteArticle(id)),
      );

      // Check for errors and collect them
      const errors = responses.filter((r: any) => isErrorResponse(r));
      if (errors.length > 0) {
        handleApiError(errors[0], "Erro ao excluir alguns artigos.");
      }

      return responses;
    },
    onSuccess: invalidateAll,
    onError: (error) => {
      console.error("Error deleting multiple articles:", error);
    },
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
