import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, GripVertical, Save, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

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
import { DraggableTrailCard } from "./draggable-trail-card";
import { TrailFiltersBar, type TrailFilters } from "./trail-filters-bar";
import type { TrailListQueryParams, Trail } from "../types";
import { toast } from "sonner";

export function TrailsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TrailListQueryParams & TrailFilters>({
    page: 1,
    pageSize: 20,
  });
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [localTrails, setLocalTrails] = useState<Trail[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading, isFetching, error } = useQuery(
    trailsListQueryOptions(filters),
  );

  const archiveMutation = useArchiveTrail();
  const deleteMutation = useDeleteTrail();
  const publishMutation = usePublishTrail();
  const updateMutation = useUpdateTrail();
  const silentUpdateMutation = useUpdateTrail({ silent: true });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleBulkReorder = async (reorderedTrails: Trail[]) => {
    const reorderPromise = async () => {
      // Phase 1: Set all trails to null to avoid conflicts
      for (const trail of reorderedTrails) {
        if (trail.unlockOrder !== null) {
          await silentUpdateMutation.mutateAsync({
            id: trail.id,
            body: { unlockOrder: null },
          });
        }
      }

      // Phase 2: Set the new order values
      for (let index = 0; index < reorderedTrails.length; index++) {
        const trail = reorderedTrails[index];
        await silentUpdateMutation.mutateAsync({
          id: trail.id,
          body: { unlockOrder: index + 1 },
        });
      }
    };

    toast.promise(reorderPromise(), {
      loading: "Salvando nova ordem...",
      success: () => {
        setHasChanges(false);
        setIsOrderMode(false);
        return "Ordem das trilhas atualizada com sucesso!";
      },
      error: "Erro ao atualizar ordem das trilhas",
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalTrails((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newOrder;
      });
    }
  };

  const handleEnterOrderMode = () => {
    if (!data?.data) return;
    
    // Sort trails by current unlockOrder (nulls at end), then by createdAt
    const sorted = [...data.data].sort((a, b) => {
      if (a.unlockOrder === null && b.unlockOrder === null) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (a.unlockOrder === null) return 1;
      if (b.unlockOrder === null) return -1;
      return a.unlockOrder - b.unlockOrder;
    });
    
    setLocalTrails(sorted);
    setIsOrderMode(true);
    setHasChanges(false);
  };

  const handleCancelOrderMode = () => {
    setIsOrderMode(false);
    setLocalTrails([]);
    setHasChanges(false);
  };

  const handleSaveOrder = () => {
    handleBulkReorder(localTrails);
  };

  const displayTrails = isOrderMode ? localTrails : (data?.data || []);

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
          {!isOrderMode && data?.data && data.data.length > 0 && (
            <Button variant="outline" onClick={handleEnterOrderMode}>
              <GripVertical className="mr-2 h-4 w-4" />
              Ordenar Trilhas
            </Button>
          )}
          {isOrderMode && (
            <>
              <Button
                variant="outline"
                onClick={handleCancelOrderMode}
                disabled={silentUpdateMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveOrder}
                disabled={!hasChanges || silentUpdateMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {silentUpdateMutation.isPending ? "Salvando..." : "Salvar Ordem"}
              </Button>
            </>
          )}
          {!isOrderMode && (
            <Button asChild>
              <Link to="/trails/create">
                <Plus className="mr-2 h-4 w-4" />
                Nova trilha
              </Link>
            </Button>
          )}
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
            {displayTrails.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma trilha encontrada.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayTrails.map((t) => t.id)}
                  strategy={rectSortingStrategy}
                >
                  {isOrderMode && (
                    <div className="bg-muted/50 border border-dashed border-primary/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <p>
                          <strong className="text-foreground">Modo de ordenação ativo:</strong>{" "}
                          Arraste as trilhas para reorganizá-las. Os números indicam a nova ordem.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {displayTrails.map((trail, index) => (
                      isOrderMode ? (
                        <DraggableTrailCard
                          key={trail.id}
                          trail={trail}
                          index={index}
                          isOrderMode={isOrderMode}
                          onEdit={handleEdit}
                          onArchive={handleArchive}
                          onDelete={handleDelete}
                          onPublish={handlePublish}
                        />
                      ) : (
                        <TrailCard
                          key={trail.id}
                          trail={trail}
                          onEdit={handleEdit}
                          onArchive={handleArchive}
                          onDelete={handleDelete}
                          onPublish={handlePublish}
                        />
                      )
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
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
