import { useState, useEffect } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { categoriesListQueryOptions } from "../api/categoriesAndTagsQueries";
import { QUESTION_TYPE_OPTIONS, DIFFICULTY_LEVEL_OPTIONS } from "../constants";

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "archived", label: "Arquivado" },
];

export interface QuestionFilters {
  search?: string;
  type?: string;
  difficulty?: string;
  status?: string;
  categoryId?: number;
}

interface QuestionFiltersBarProps {
  filters: QuestionFilters;
  onFiltersChange: (filters: QuestionFilters) => void;
}

export function QuestionFiltersBar({
  filters,
  onFiltersChange,
}: QuestionFiltersBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const { data: categories = [] } = useQuery(categoriesListQueryOptions());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput || undefined });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchInput("");
    // Send undefined values for all current filters to clear them
    const clearedFilters: QuestionFilters = {};
    Object.keys(filters).forEach(key => {
      if (key !== 'search') { // search is handled by setSearchInput
        (clearedFilters as any)[key] = undefined;
      }
    });
    clearedFilters.search = undefined;
    onFiltersChange(clearedFilters);
  };

  const handleFilterChange = (key: keyof QuestionFilters, value: any) => {
    // Create a partial update object with just the changed filter
    const filterUpdate: Partial<QuestionFilters> = {};
    
    if (value === "all" || !value || value === undefined || value === null || value === '') {
      // Set to undefined to signal removal
      filterUpdate[key] = undefined;
    } else {
      filterUpdate[key] = value;
    }
    
    onFiltersChange(filterUpdate);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar questões..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchInput("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 rounded-full px-1.5 py-0 text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filtros</h4>
                <p className="text-xs text-muted-foreground">
                  Refine sua busca usando os filtros abaixo
                </p>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={filters.type ?? "all"}
                  onValueChange={(v) => handleFilterChange("type", v === "all" ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {QUESTION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Dificuldade</label>
                <Select
                  value={filters.difficulty ?? "all"}
                  onValueChange={(v) => handleFilterChange("difficulty", v === "all" ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as dificuldades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as dificuldades</SelectItem>
                    {DIFFICULTY_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status ?? "all"}
                  onValueChange={(v) => handleFilterChange("status", v === "all" ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={filters.categoryId?.toString() ?? "all"}
                  onValueChange={(v) =>
                    handleFilterChange(
                      "categoryId",
                      v === "all" ? undefined : Number(v),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{filters.search}"
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setSearchInput("");
                  handleFilterChange("search", undefined);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Tipo:{" "}
              {
                QUESTION_TYPE_OPTIONS.find((o) => o.value === filters.type)
                  ?.label
              }
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleFilterChange("type", undefined);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.difficulty && (
            <Badge variant="secondary" className="gap-1">
              Dificuldade:{" "}
              {
                DIFFICULTY_LEVEL_OPTIONS.find(
                  (o) => o.value === filters.difficulty,
                )?.label
              }
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleFilterChange("difficulty", undefined);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status:{" "}
              {STATUS_OPTIONS.find((o) => o.value === filters.status)?.label}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleFilterChange("status", undefined);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.categoryId && (
            <Badge variant="secondary" className="gap-1">
              Categoria:{" "}
              {categories.find((c: any) => c.id === filters.categoryId)?.name ||
                "N/A"}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleFilterChange("categoryId", undefined);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
