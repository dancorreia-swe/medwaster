import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { TagsTable, type TagTableItem } from "./tags-table";
import { TagFormDialog, type TagFormValues } from "./tag-form-dialog";
import type { TagsSearch } from "../types";
import {
  useTagsList,
  useDeleteTag,
  useCreateTag,
  useUpdateTag,
} from "../hooks";

interface TagsPageProps {
  search: TagsSearch;
  searchValue: string;
  isSearching: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function TagsPage({
  search,
  searchValue,
  isSearching,
  onSearchChange,
  onSearchSubmit,
}: TagsPageProps) {
  const { tags, isInitialLoading, isError, errorMessage } = useTagsList(search);

  const [tagPendingDelete, setTagPendingDelete] = useState<TagTableItem | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<TagTableItem | null>(null);

  const deleteTagMutation = useDeleteTag();
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag(tagToEdit?.id as number | undefined);

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
      setTagToEdit(null);
    }
  }

  async function handleFormSubmit(values: TagFormValues) {
    try {
      if (tagToEdit) {
        await updateTagMutation.mutateAsync(values);
      } else {
        await createTagMutation.mutateAsync(values);
      }
      setIsFormDialogOpen(false);
      setTagToEdit(null);
    } catch (error) {
      console.error(error);
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
      setIsDeleteDialogOpen(false);
      setTagPendingDelete(null);
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

      <form className="flex flex-col gap-2" onSubmit={onSearchSubmit}>
        <label className="sr-only" htmlFor="tags-search">
          Buscar tags
        </label>
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            id="tags-search"
            type="search"
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Buscar tags..."
            className="pl-9"
          />

          {isSearching && (
            <Spinner className="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
          )}
        </div>
      </form>

      {isError ? (
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
          data={tags}
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
              {deleteTagMutation.isPending && <Spinner className="mr-2" />}
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
