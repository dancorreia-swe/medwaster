import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCategories } from "@/features/categories/hooks";
import { CategoriesTable } from "@/features/categories/components";
import { categoriesListQueryOptions } from "@/features/categories/api";

export const Route = createFileRoute("/_auth/categories/")({
  beforeLoad: () => ({ getTitle: () => "Categorias" }),
  loader: ({ context: { queryClient } }) => {
    // Prefetch categories data
    return queryClient.ensureQueryData(categoriesListQueryOptions());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading, isError, error } = useCategories();

  const categories = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Gerencie as categorias utilizadas para organizar artigos, trilhas e
            outros conteúdos da plataforma. Cada categoria pode ter subcategorias
            para melhor estruturação.
          </p>
        </header>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar categorias</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Ocorreu um erro ao carregar as categorias"}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="min-h-[400px] rounded-md border border-border bg-card">
          <Loader />
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && <CategoriesTable categories={categories} />}
    </div>
  );
}
