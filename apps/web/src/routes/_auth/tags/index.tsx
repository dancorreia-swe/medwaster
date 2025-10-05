import { useEffect, useMemo, useState } from "react";

import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import {
  listTagsQueryOptions,
  type ListTagsQueryInput,
} from "@/features/tags/api/list-tags";
import { TagsTable } from "@/features/tags/components/tags-table";
import type { TagTableItem } from "@/features/tags/components/tags-table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { z } from "zod";

import type { ListTagsQuery } from "@server/modules/tags/model";
import { Spinner } from "@/components/ui/spinner";

const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, "A busca pode ter no máximo 100 caracteres")
    .optional(),
});

type TagsSearch = z.infer<typeof searchSchema>;

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

export const Route = createFileRoute("/_auth/tags/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) => {
    const query = buildListQuery(search as TagsSearch);
    return queryClient.ensureQueryData(listTagsQueryOptions(query));
  },
  component: TagsRoute,
});

function TagsRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const [searchValue, setSearchValue] = useState(search.q ?? "");
  const debouncedSearch = useDebouncedCallback((value: string) => {
    navigate({
      replace: true,
      search: (prev) => ({
        ...prev,
        q: value ? value : undefined,
      }),
    });
  }, 400);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const listQuery = useMemo(() => buildListQuery(search), [search]);
  const tagsQuery = useQuery(listTagsQueryOptions(listQuery));

  const tagsResponse = tagsQuery.data;
  const tags = tagsResponse ?? [];

  const tableData = useMemo<TagTableItem[]>(
    () =>
      tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        color: tag.color,
        createdAt: tag.createdAt,
      })),
    [tags],
  );

  const isInitialLoading = tagsQuery.isPending && !tagsResponse;
  const isSearching = tagsQuery.isFetching && !tagsQuery.isPending;

  const errorMessage =
    tagsQuery.error instanceof Error
      ? tagsQuery.error.message
      : "Não foi possível carregar as tags.";

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    setSearchValue(value);
    debouncedSearch(value.trim());
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    debouncedSearch.cancel();

    const value = searchValue.trim();
    navigate({
      replace: true,
      search: (prev) => ({
        ...prev,
        q: value ? value : undefined,
      }),
    });
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold md:text-3xl">Tags</h1>
          <p className="text-sm text-muted-foreground md:max-w-2xl">
            Organize e padronize as tags utilizadas em filtros, relatórios e
            fluxos de criação de conteúdo.
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova tag
        </Button>
      </header>

      <form className="flex flex-col gap-2" onSubmit={handleSearchSubmit}>
        <label className="sr-only" htmlFor="tags-search">
          Buscar tags
        </label>
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            id="tags-search"
            type="search"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Buscar tags..."
            className="pl-9"
          />

          {isSearching && (
            <Spinner className="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
          )}
        </div>
      </form>

      {tagsQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar as tags</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {isInitialLoading ? (
        <div className="min-h-[240px] rounded-md border border-border bg-card">
          <Loader />
        </div>
      ) : (
        <TagsTable
          data={tableData}
          onEdit={(tag) => console.info("Editar tag", tag)}
          onDelete={(tag) => console.info("Excluir tag", tag)}
        />
      )}
    </div>
  );
}
