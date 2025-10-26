import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { listTagsQueryOptions } from "@/features/tags/api";
import { TagsPage } from "@/features/tags/components";
import { searchSchema, type TagsSearch } from "@/features/tags/types";
import { buildListQuery } from "@/features/tags/hooks";

export const Route = createFileRoute("/_auth/tags/")({
  validateSearch: searchSchema,
  beforeLoad: () => ({ getTitle: () => "Tags" }),
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) => {
    const query = buildListQuery(search as TagsSearch);
    return queryClient.ensureQueryData(listTagsQueryOptions(query));
  },
  component: TagsRoute,
});

function TagsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [searchValue, setSearchValue] = useState(search.q ?? "");
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    navigate({
      replace: true,
      search: (prev) => ({
        ...prev,
        q: value ? value : undefined,
      }),
    });
    setIsSearching(false);
  }, 400);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    setSearchValue(value);
    setIsSearching(true);
    debouncedSearch(value);
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <TagsPage
      search={search}
      searchValue={searchValue}
      isSearching={isSearching}
      onSearchChange={handleSearchChange}
      onSearchSubmit={handleSearchSubmit}
    />
  );
}
