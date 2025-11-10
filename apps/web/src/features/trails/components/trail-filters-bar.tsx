import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { categoriesListQueryOptions } from "@/features/questions/api/categoriesAndTagsQueries";
import type { TrailStatus, TrailDifficulty } from "../types";

export interface TrailFilters {
  search?: string;
  status?: TrailStatus[];
  difficulty?: TrailDifficulty[];
  categoryId?: number[];
}

interface TrailFiltersBarProps {
  filters: TrailFilters;
  onFiltersChange: (filters: TrailFilters) => void;
}

const difficultyOptions = [
  { value: "basic", label: "Básico" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
] as const;

const statusOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "inactive", label: "Inativo" },
  { value: "archived", label: "Arquivado" },
] as const;

export function TrailFiltersBar({
  filters,
  onFiltersChange,
}: TrailFiltersBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const [statusOpen, setStatusOpen] = useState(false);
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery(categoriesListQueryOptions());

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onFiltersChange({ ...filters, search: localSearch.trim() || undefined });
    },
    [filters, localSearch, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      // Clear search immediately when empty for better UX
      if (value.trim() === "") {
        onFiltersChange({ ...filters, search: undefined });
      }
    },
    [filters, onFiltersChange]
  );

  const toggleFilterValue = useCallback(
    <T,>(filterKey: keyof TrailFilters, value: T) => {
      const currentValues = (filters[filterKey] as T[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      onFiltersChange({
        ...filters,
        [filterKey]: newValues.length > 0 ? newValues : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    setLocalSearch("");
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status.length > 0) ||
      (filters.difficulty && filters.difficulty.length > 0) ||
      (filters.categoryId && filters.categoryId.length > 0)
  );

  const selectedStatusCount = filters.status?.length || 0;
  const selectedDifficultyCount = filters.difficulty?.length || 0;
  const selectedCategoryCount = filters.categoryId?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm">
          <Label htmlFor="search" className="sr-only">
            Pesquisar trilhas
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Pesquisar trilhas..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[140px] justify-between">
                Status
                {selectedStatusCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-full px-1.5 py-0.5 text-xs"
                  >
                    {selectedStatusCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Filtrar status..." />
                <CommandList>
                  <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
                  <CommandGroup>
                    {statusOptions.map((option) => {
                      const isSelected =
                        filters.status?.includes(option.value) || false;
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => toggleFilterValue("status", option.value)}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span>{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Difficulty Filter */}
          <Popover open={difficultyOpen} onOpenChange={setDifficultyOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[140px] justify-between">
                Dificuldade
                {selectedDifficultyCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-full px-1.5 py-0.5 text-xs"
                  >
                    {selectedDifficultyCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Filtrar dificuldade..." />
                <CommandList>
                  <CommandEmpty>Nenhuma dificuldade encontrada.</CommandEmpty>
                  <CommandGroup>
                    {difficultyOptions.map((option) => {
                      const isSelected =
                        filters.difficulty?.includes(option.value) || false;
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() =>
                            toggleFilterValue("difficulty", option.value)
                          }
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span>{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Category Filter */}
          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[140px] justify-between"
                disabled={categoriesLoading}
              >
                {categoriesLoading
                  ? "Carregando..."
                  : categoriesError
                  ? "Erro ao carregar"
                  : "Categoria"}
                {selectedCategoryCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-full px-1.5 py-0.5 text-xs"
                  >
                    {selectedCategoryCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Filtrar categoria..." />
                <CommandList>
                  <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                  <CommandGroup>
                    {Array.isArray(categories) &&
                      categories.map((category) => {
                        const isSelected =
                          filters.categoryId?.includes(category.id) || false;
                        return (
                          <CommandItem
                            key={category.id}
                            onSelect={() =>
                              toggleFilterValue("categoryId", category.id)
                            }
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </div>
                            <span>{category.name}</span>
                          </CommandItem>
                        );
                      })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="outline" size="default" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
