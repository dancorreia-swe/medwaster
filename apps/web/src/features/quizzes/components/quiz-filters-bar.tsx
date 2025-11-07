import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesListQueryOptions } from "@/features/questions/api/categoriesAndTagsQueries";
import type { QuizFilters } from "../types";

// Constants for filter values to ensure consistency
const ALL_VALUES = {
  STATUS: "all-status",
  DIFFICULTY: "all-difficulty", 
  CATEGORY: "all-category",
} as const;

// Type for category from API
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface QuizFiltersBarProps {
  /** Current filter values */
  filters: QuizFilters;
  /** Callback fired when filters change */
  onFiltersChange: (filters: QuizFilters) => void;
}

const difficultyOptions = [
  { value: "basic", label: "Básico" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
  { value: "mixed", label: "Misto" },
];

const statusOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "archived", label: "Arquivado" },
];

/**
 * Quiz filters bar component with search, status, difficulty, and category filters.
 * 
 * Features:
 * - Real-time search with form submission
 * - Dropdown filters for status, difficulty, and category
 * - Clear all filters functionality
 * - Loading states and error handling for categories
 * - Consistent empty value handling across all selects
 */
export function QuizFiltersBar({ filters, onFiltersChange }: QuizFiltersBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useQuery(categoriesListQueryOptions());

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onFiltersChange({ ...filters, search: localSearch.trim() || undefined });
    },
    [filters, localSearch, onFiltersChange],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      // Clear search immediately when empty for better UX
      if (value.trim() === "") {
        onFiltersChange({ ...filters, search: undefined });
      }
    },
    [filters, onFiltersChange],
  );

  const clearFilters = useCallback(() => {
    setLocalSearch("");
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.difficulty || filters.categoryId
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm">
          <Label htmlFor="search" className="sr-only">
            Pesquisar quizzes
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Pesquisar quizzes..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          <div className="min-w-[140px]">
            <Label htmlFor="status" className="sr-only">
              Status
            </Label>
            <Select
              value={filters.status || ALL_VALUES.STATUS}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value === ALL_VALUES.STATUS ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUES.STATUS}>Todos os status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px]">
            <Label htmlFor="difficulty" className="sr-only">
              Dificuldade
            </Label>
            <Select
              value={filters.difficulty || ALL_VALUES.DIFFICULTY}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  difficulty: value === ALL_VALUES.DIFFICULTY ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUES.DIFFICULTY}>Todas as dificuldades</SelectItem>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px]">
            <Label htmlFor="category" className="sr-only">
              Categoria
            </Label>
            <Select
              value={filters.categoryId?.toString() || ALL_VALUES.CATEGORY}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  categoryId: value === ALL_VALUES.CATEGORY ? undefined : Number(value),
                })
              }
              disabled={categoriesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  categoriesLoading 
                    ? "Carregando..." 
                    : categoriesError 
                    ? "Erro ao carregar" 
                    : "Categoria"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUES.CATEGORY}>Todas as categorias</SelectItem>
                {Array.isArray(categories) && categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
                {categoriesError && (
                  <SelectItem value="error" disabled>
                    Erro ao carregar categorias
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

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