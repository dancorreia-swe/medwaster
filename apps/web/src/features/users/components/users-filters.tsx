import { useState, useCallback, useEffect } from "react";
import { Search, XCircle } from "lucide-react";

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

export type UsersStatusFilter = "all" | "active" | "banned";

export interface UsersFiltersState {
  search: string;
  role: string;
  status: UsersStatusFilter;
}

interface UsersFiltersProps {
  value: UsersFiltersState;
  onChange: (value: UsersFiltersState) => void;
}

export function UsersFilters({ value, onChange }: UsersFiltersProps) {
  const [localSearch, setLocalSearch] = useState(value.search);

  useEffect(() => {
    setLocalSearch(value.search);
  }, [value.search]);

  // Debounced search - apply automatically after 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch.trim() !== value.search) {
        onChange({ ...value, search: localSearch.trim() });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleClear = useCallback(() => {
    setLocalSearch("");
    onChange({ search: "", role: "", status: "all" });
  }, [onChange]);

  const hasActiveFilters = value.role || value.status !== "all" || localSearch.trim();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="users-search" className="text-sm font-medium">
          Buscar
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="users-search"
            placeholder="Pesquisar por nome ou email..."
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="w-full space-y-2 lg:w-48">
        <Label htmlFor="users-role" className="text-sm font-medium">
          Função
        </Label>
        <Input
          id="users-role"
          placeholder="Ex: admin"
          value={value.role}
          onChange={(event) =>
            onChange({ ...value, role: event.target.value })
          }
        />
      </div>

      <div className="w-full space-y-2 lg:w-48">
        <Label htmlFor="users-status" className="text-sm font-medium">
          Status
        </Label>
        <Select
          value={value.status}
          onValueChange={(status: UsersStatusFilter) =>
            onChange({ ...value, status })
          }
        >
          <SelectTrigger id="users-status" className="justify-between">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="banned">Banidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleClear}
          className="lg:mb-0"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
