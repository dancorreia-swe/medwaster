import { queryOptions } from "@tanstack/react-query";
import { categoriesApi } from "./categoriesApi";

export const categoriesQueryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesQueryKeys.all, "list"] as const,
  list: (params?: { page?: number; pageSize?: number }) =>
    [...categoriesQueryKeys.lists(), params] as const,
  details: () => [...categoriesQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...categoriesQueryKeys.details(), id] as const,
};

export const categoriesListQueryOptions = (params?: {
  page?: number;
  pageSize?: number;
}) =>
  queryOptions({
    queryKey: categoriesQueryKeys.list(params),
    queryFn: () => categoriesApi.listCategories(params),
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000, // 10 minutes
  });

export const categoryQueryOptions = (id: number) =>
  queryOptions({
    queryKey: categoriesQueryKeys.detail(id),
    queryFn: () => categoriesApi.getCategory(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 5 * 60_000,
  });
