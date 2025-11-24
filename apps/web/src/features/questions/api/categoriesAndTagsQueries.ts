import { queryOptions } from "@tanstack/react-query";
import { categoriesApi } from "./categoriesApi";
import { tagsApi } from "./tagsApi";

export const categoriesQueryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesQueryKeys.all, "list"] as const,
  list: () => [...categoriesQueryKeys.lists()] as const,
  details: () => [...categoriesQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...categoriesQueryKeys.details(), id] as const,
};

export const tagsQueryKeys = {
  all: ["tags"] as const,
  lists: () => [...tagsQueryKeys.all, "list"] as const,
  list: (query?: { search?: string; keys?: string[] }) => [...tagsQueryKeys.lists(), query] as const,
};

export const categoriesListQueryOptions = () =>
  queryOptions({
    queryKey: categoriesQueryKeys.list(),
    queryFn: () => categoriesApi.listCategories(),
    staleTime: 10 * 60_000, // 10 minutes - categories don't change often
  });

export const tagsListQueryOptions = (query?: { search?: string; keys?: string[] }) =>
  queryOptions({
    queryKey: tagsQueryKeys.list(query),
    queryFn: () => tagsApi.listTags(query),
    staleTime: 5 * 60_000, // 5 minutes
  });
