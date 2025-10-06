import { useEffect, useMemo, useState } from "react";

import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import {
  listTagsQueryOptions,
  type ListTagsQueryInput,
  type TagDto,
} from "@/features/tags/api/list-tags";
import { TagsTable } from "@/features/tags/components/tags-table";
import type { TagTableItem } from "@/features/tags/components/tags-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { z } from "zod";

import type { ListTagsQuery } from "@server/modules/tags/model";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteTag } from "@/features/tags/api/delete-tag";
import { tagsQueryKeys } from "@/features/tags/api/list-tags";
import {
  TagFormDialog,
  type TagFormValues,
} from "@/features/tags/components/tag-form-dialog";

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
  beforeLoad: () => ({ getTitle: () => "Tags" }),
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
  const queryClient = useQueryClient();

  const [tagPendingDelete, setTagPendingDelete] = useState<TagTableItem | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<TagTableItem | null>(null);

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

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => deleteTag(tagId),
    onSuccess: () => {
      toast.success("Tag excluída com sucesso.");

      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
      setIsDeleteDialogOpen(false);
      setTagPendingDelete(null);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a tag.";
      toast.error(message);
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (values: TagFormValues) => {
      // TODO: Implement API call
      console.log("Create tag:", values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return values;
    },
    onSuccess: () => {
      toast.success("Tag criada com sucesso.");
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
      setIsFormDialogOpen(false);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível criar a tag.";
      toast.error(message);
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async (values: TagFormValues) => {
      // TODO: Implement API call
      console.log("Update tag:", tagToEdit?.id, values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return values;
    },
    onSuccess: () => {
      toast.success("Tag atualizada com sucesso.");
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
      setIsFormDialogOpen(false);
      setTagToEdit(null);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a tag.";
      toast.error(message);
    },
  });

  const tableData = useMemo<TagTableItem[]>(
    () =>
      tags.map((tag: TagDto) => ({
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

  function handleRequestDelete(tag: TagTableItem) {
    setTagPendingDelete(tag);
    setIsDeleteDialogOpen(true);
  }

  function handleDeleteDialogChange(open: boolean) {
    if (deleteTagMutation.isPending) return;
    setIsDeleteDialogOpen(open);
    if (!open) {
      setTagPendingDelete(null);
    }
  }

  function handleCreateTag() {
    setTagToEdit(null);
    setIsFormDialogOpen(true);
  }

  function handleEditTag(tag: TagTableItem) {
    setTagToEdit(tag);
    setIsFormDialogOpen(true);
  }

  function handleFormDialogChange(open: boolean) {
    if (createTagMutation.isPending || updateTagMutation.isPending) return;
    setIsFormDialogOpen(open);

    if (!open) {
      console.log("Resetting tag to edit");
      setTagToEdit(null);
    }
  }

  async function handleFormSubmit(values: TagFormValues) {
    if (tagToEdit) {
      await updateTagMutation.mutateAsync(values);
    } else {
      await createTagMutation.mutateAsync(values);
    }
  }

  async function handleConfirmDelete(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    if (!tagPendingDelete) return;

    const rawId = tagPendingDelete.id;
    const numericId = typeof rawId === "number" ? rawId : Number(rawId);

    if (!Number.isFinite(numericId)) {
      toast.error("Identificador de tag inválido.");
      return;
    }

    try {
      await deleteTagMutation.mutateAsync(numericId);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold md:text-3xl">Tags</h1>
          <p className="text-sm text-muted-foreground md:max-w-2xl">
            Organize e padronize as tags utilizadas em filtros, relatórios e
            fluxos de criação de conteúdo.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={handleCreateTag}>
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
          onEdit={handleEditTag}
          onDelete={handleRequestDelete}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tag</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Tem certeza de que deseja excluir
              a tag
              <span className="font-semibold text-foreground">
                {tagPendingDelete?.name
                  ? ` "${tagPendingDelete.name}"`
                  : "selecionada"}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTagMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
              onClick={handleConfirmDelete}
              disabled={deleteTagMutation.isPending}
            >
              {deleteTagMutation.isPending ? (
                <Spinner className="mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TagFormDialog
        open={isFormDialogOpen}
        onOpenChange={handleFormDialogChange}
        tag={tagToEdit}
        onSubmit={handleFormSubmit}
        isSubmitting={
          createTagMutation.isPending || updateTagMutation.isPending
        }
      />
    </div>
  );
}
