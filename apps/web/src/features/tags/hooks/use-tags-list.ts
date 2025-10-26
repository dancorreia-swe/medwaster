import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TagsSearch } from "../types";
import { listTagsQueryOptions, type ListTagsQueryInput } from "../api";
import type { ListTagsQuery } from "@server/modules/tags/model";

function buildListQuery(search?: TagsSearch | null): ListTagsQueryInput {
  if (!search) return undefined;

  const term = search.q?.trim();
  if (!term) return undefined;

  const keys: NonNullable<ListTagsQuery["keys"]> = ["name", "slug"];

  return {
    search: term,
    keys,
  };
}

export function useTagsList(search: TagsSearch) {
  const listQuery = useMemo(() => buildListQuery(search), [search]);
  const tagsQuery = useQuery(listTagsQueryOptions(listQuery));

  const tags = tagsQuery.data ?? [];

  const isInitialLoading = tagsQuery.isLoading && !tagsQuery.data;
  const isSearching = tagsQuery.isFetching && !!tagsQuery.data;

  const errorMessage = tagsQuery.error
    ? tagsQuery.error instanceof Error
      ? tagsQuery.error.message
      : "Ocorreu um erro inesperado ao carregar as tags."
    : "";

  return {
    tags,
    isLoading: tagsQuery.isLoading,
    isInitialLoading,
    isSearching,
    isError: tagsQuery.isError,
    errorMessage,
  };
}

export { buildListQuery };
