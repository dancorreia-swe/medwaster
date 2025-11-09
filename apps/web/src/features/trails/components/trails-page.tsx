import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  trailsListQueryOptions,
  useArchiveTrail,
  useDeleteTrail,
  usePublishTrail,
  useUpdateTrail,
} from "../api/trailsQueries";
import { TrailCard } from "./trail-card";
import { TrailFiltersBar, type TrailFilters } from "./trail-filters-bar";
import { TrailOrderManager } from "./trail-order-manager";
import type { TrailListQueryParams, Trail } from "../types";
import { toast } from "sonner";

export function TrailsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TrailListQueryParams & TrailFilters>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading, isFetching, error } = useQuery(
    trailsListQueryOptions(filters)
  );

  const archiveMutation = useArchiveTrail();
  const deleteMutation = useDeleteTrail();
  const publishMutation = usePublishTrail();
  const updateMutation = useUpdateTrail();

  const handleFiltersChange = (newFilters: TrailFilters) => {
    setFilters((prev) => {
      // Start with base pagination props only
      const updated: TrailListQueryParams & TrailFilters = {
        page: 1,
        pageSize: prev.pageSize,
      };

      // Add current filters that aren't being changed
      Object.entries(prev).forEach(([key, value]) => {
        if (
          !["page", "pageSize"].includes(key) &&
          !(key in newFilters) &&
          value !== undefined
        ) {
          (updated as any)[key] = value;
        }
      });

      // Add new filters that have defined values
      Object.entries(newFilters).forEach(([key, value]) => {
        // Check for non-empty values (including arrays)
        const hasValue =
          value !== undefined &&
          value !== null &&
          value !== "" &&
          (!Array.isArray(value) || value.length > 0);

        if (hasValue) {
          (updated as any)[key] = value;
        }
      });

      return updated;
    });
  };

  const handleEdit = (trail: Trail) => {
    navigate({
      to: "/trails/$trailId/edit",
      params: { trailId: trail.id.toString() },
    });
  };

  const handleArchive = async (trail: Trail) => {
    try {
      await archiveMutation.mutateAsync(trail.id);
    } catch (error) {
      console.error("Error archiving trail:", error);
    }
  };

  const handleDelete = async (trail: Trail) => {
    if (confirm(`Tem certeza que deseja excluir a trilha "${trail.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(trail.id);
      } catch (error) {
        console.error("Error deleting trail:", error);
      }
    }
  };

  const handlePublish = async (trail: Trail) => {
    try {
      await publishMutation.mutateAsync(trail.id);
    } catch (error) {
      console.error("Error publishing trail:", error);
    }
  };

  const handleUpdateOrder = async (trailId: number, newOrder: number | null) => {
    try {
      await updateMutation.mutateAsync({
        id: trailId,
        body: { unlockOrder: newOrder },
      });
    } catch (error) {
      console.error("Error updating trail order:", error);
    }
  };

  const handleBulkReorder = async (reorderedTrails: Trail[]) => {
    try {
      toast.loading("Salvando nova ordem...", { id: "bulk-reorder" });

      // Update each trail with its new order (position + 1)
      const updates = reorderedTrails.map((trail, index) =>
        updateMutation.mutateAsync({
          id: trail.id,
          body: { unlockOrder: index + 1 },
        })
      );

      await Promise.all(updates);
      toast.success("Ordem das trilhas atualizada com sucesso!", {
        id: "bulk-reorder",
      });
    } catch (error) {
      console.error("Error bulk reordering trails:", error);
      toast.error("Erro ao atualizar ordem das trilhas", { id: "bulk-reorder" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trilhas</h1>
          <p className="text-muted-foreground">
            Gerencie trilhas de aprendizado do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.data && data.data.length > 0 && (
            <TrailOrderManager trails={data.data} onSave={handleBulkReorder} />
          )}
          <Button asChild>
            <Link to="/trails/create">
              <Plus className="mr-2 h-4 w-4" />
              Nova trilha
            </Link>
          </Button>
        </div>
      </div>

      <TrailFiltersBar
        filters={{
          search: filters.search,
          status: filters.status,
          difficulty: filters.difficulty,
          categoryId: filters.categoryId,
        }}
        onFiltersChange={handleFiltersChange}
      />

      <div className="relative">
        {isFetching && !isLoading && (
          <div className="absolute right-4 top-4 z-10">
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Atualizando...
            </div>
          </div>
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Erro ao carregar trilhas. Tente novamente.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <TrailsSkeleton />
        ) : data ? (
          <div className="space-y-6">
            {data.data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma trilha encontrada.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.data.map((trail) => (
                  <TrailCard
                    key={trail.id}
                    trail={trail}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onPublish={handlePublish}
                    onUpdateOrder={handleUpdateOrder}
                  />
                ))}
              </div>
            )}

            {data.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))
                  }
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {data.meta.page} de {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === data.meta.totalPages}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))
                  }
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TrailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
