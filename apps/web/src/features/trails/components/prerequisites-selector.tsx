import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, X, Lock, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trailsListQueryOptions } from "../api/trailsQueries";
import type { Trail, TrailPrerequisite } from "../types";

interface PrerequisitesSelectorProps {
  trailId?: number;
  prerequisites: TrailPrerequisite[];
  onAdd: (trailId: number) => void;
  onBatchAdd?: (trailIds: number[]) => void;
  onRemove: (prerequisiteTrailId: number) => void;
}

export function PrerequisitesSelector({
  trailId,
  prerequisites,
  onAdd,
  onBatchAdd,
  onRemove,
}: PrerequisitesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTrailIds, setSelectedTrailIds] = useState<Set<number>>(
    new Set(),
  );

  // Fetch available trails
  const { data: trails } = useQuery({
    ...trailsListQueryOptions({
      search,
      status: ["published"],
      pageSize: 50,
    }),
    enabled: isOpen,
  });

  const existingPrerequisiteIds = new Set(
    prerequisites.map((p) => p.prerequisiteTrailId),
  );

  const availableTrails =
    trails?.data.filter(
      (trail) => trail.id !== trailId && !existingPrerequisiteIds.has(trail.id),
    ) || [];

  const toggleSelection = (trailId: number) => {
    setSelectedTrailIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trailId)) {
        newSet.delete(trailId);
      } else {
        newSet.add(trailId);
      }
      return newSet;
    });
  };

  const handleAddSelected = () => {
    if (selectedTrailIds.size === 0) return;

    const trailIdsArray = Array.from(selectedTrailIds);

    // Use batch add if available for better performance
    if (onBatchAdd && trailIdsArray.length > 1) {
      onBatchAdd(trailIdsArray);
    } else {
      // Fallback to individual adds
      trailIdsArray.forEach((id) => onAdd(id));
    }

    setSelectedTrailIds(new Set());
    setSearch("");
    setIsOpen(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "basic":
        return "secondary";
      case "intermediate":
        return "default";
      case "advanced":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Pré-requisitos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Trilhas que devem ser completadas antes desta
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Pré-requisito</DialogTitle>
              <DialogDescription>
                Selecione trilhas que devem ser completadas antes desta
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prerequisite-search">Pesquisar Trilhas</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="prerequisite-search"
                    placeholder="Pesquisar trilhas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 space-y-2">
                  {availableTrails.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {trails?.data.length === 0
                        ? "Nenhuma trilha encontrada"
                        : "Todas as trilhas já foram adicionadas"}
                    </div>
                  ) : (
                    availableTrails.map((trail) => {
                      const isSelected = selectedTrailIds.has(trail.id);

                      return (
                        <Card
                          key={trail.id}
                          className={`p-4 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-accent border-primary"
                              : "hover:bg-accent"
                          }`}
                          onClick={() => toggleSelection(trail.id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="mt-1 flex items-center gap-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    toggleSelection(trail.id)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Lock className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium line-clamp-2 text-sm">
                                  {trail.name}
                                </h4>
                                {trail.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {trail.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant={getDifficultyColor(
                                      trail.difficulty,
                                    )}
                                    className="text-xs"
                                  >
                                    {trail.difficulty === "basic"
                                      ? "Básico"
                                      : trail.difficulty === "intermediate"
                                        ? "Intermediário"
                                        : "Avançado"}
                                  </Badge>
                                  {trail.unlockOrder !== null && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      #{trail.unlockOrder}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedTrailIds.size > 0 ? (
                    <span className="font-medium">
                      {selectedTrailIds.size}{" "}
                      {selectedTrailIds.size === 1
                        ? "trilha selecionada"
                        : "trilhas selecionadas"}
                    </span>
                  ) : (
                    <span>Nenhuma trilha selecionada</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTrailIds(new Set());
                      setSearch("");
                      setIsOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddSelected}
                    disabled={selectedTrailIds.size === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar{" "}
                    {selectedTrailIds.size > 0
                      ? `(${selectedTrailIds.size})`
                      : ""}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {prerequisites.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Nenhum pré-requisito adicionado
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {prerequisites.map((prereq) => (
            <Card key={prereq.prerequisiteTrailId} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {prereq.prerequisiteTrail?.name || "Trilha desconhecida"}
                    </p>
                    {prereq.prerequisiteTrail && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={getDifficultyColor(
                            prereq.prerequisiteTrail.difficulty,
                          )}
                          className="text-xs"
                        >
                          {prereq.prerequisiteTrail.difficulty === "basic"
                            ? "Básico"
                            : prereq.prerequisiteTrail.difficulty ===
                                "intermediate"
                              ? "Intermediário"
                              : "Avançado"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(prereq.prerequisiteTrailId)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
