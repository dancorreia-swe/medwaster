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

import { CategoriesTable } from "./table";
import { CategoryFormDialog, type CategoryFormValues } from "./category-form-dialog";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "../hooks";
import type { Category } from "../api";

interface CategoriesPageProps {
  searchValue: string;
  isSearching: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function CategoriesPage({
  searchValue,
  isSearching,
  onSearchChange,
  onSearchSubmit,
}: CategoriesPageProps) {
  const { data: categoriesResponse, isLoading: isInitialLoading, isError, error } = useCategories();
  const categories = categoriesResponse?.data || [];
  const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

  const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const deleteCategoryMutation = useDeleteCategory();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  function handleRequestDelete(category: Category) {
    setCategoryPendingDelete(category);
    setIsDeleteDialogOpen(true);
  }

  function handleDeleteDialogChange(open: boolean) {
    if (deleteCategoryMutation.isPending) return;
    setIsDeleteDialogOpen(open);

    if (!open) {
      setCategoryPendingDelete(null);
    }
  }

  function handleCreateCategory() {
    setCategoryToEdit(null);
    setIsFormDialogOpen(true);
  }

  function handleEditCategory(category: Category) {
    setCategoryToEdit(category);
    setIsFormDialogOpen(true);
  }

  function handleFormDialogChange(open: boolean) {
    if (createCategoryMutation.isPending || updateCategoryMutation.isPending) return;
    setIsFormDialogOpen(open);

    if (!open) {
      setCategoryToEdit(null);
    }
  }

  async function handleFormSubmit(values: CategoryFormValues) {
    try {
      if (categoryToEdit) {
        await updateCategoryMutation.mutateAsync({
          id: categoryToEdit.id,
          ...values,
        });
      } else {
        await createCategoryMutation.mutateAsync(values);
      }
      setIsFormDialogOpen(false);
      setCategoryToEdit(null);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleConfirmDelete(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    if (!categoryPendingDelete) return;

    const numericId = Number(categoryPendingDelete.id);

    if (!Number.isFinite(numericId)) {
      toast.error("Identificador de categoria inválido.");
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(numericId);
      setIsDeleteDialogOpen(false);
      setCategoryPendingDelete(null);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold md:text-3xl">Categorias</h1>
          <p className="text-sm text-muted-foreground md:max-w-2xl">
            Organize e categorize o conteúdo da plataforma para facilitar a navegação e busca.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={handleCreateCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </header>

      <form className="flex flex-col gap-2" onSubmit={onSearchSubmit}>
        <label className="sr-only" htmlFor="categories-search">
          Buscar categorias
        </label>
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            id="categories-search"
            type="search"
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Buscar categorias..."
            className="pl-9"
          />

          {isSearching && (
            <Spinner className="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
          )}
        </div>
      </form>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar as categorias</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {isInitialLoading ? (
        <div className="min-h-[240px] rounded-md border border-border bg-card">
          <Loader />
        </div>
      ) : (
        <CategoriesTable 
          categories={categories}
          onEdit={handleEditCategory}
          onDelete={handleRequestDelete}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Tem certeza de que deseja excluir
              a categoria
              <span className="font-semibold text-foreground">
                {categoryPendingDelete?.name
                  ? ` "${categoryPendingDelete.name}"`
                  : "selecionada"}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategoryMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
              onClick={handleConfirmDelete}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending && <Spinner className="mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryFormDialog
        open={isFormDialogOpen}
        onOpenChange={handleFormDialogChange}
        category={categoryToEdit}
        onSubmit={handleFormSubmit}
        isSubmitting={
          createCategoryMutation.isPending || updateCategoryMutation.isPending
        }
      />
    </div>
  );
}