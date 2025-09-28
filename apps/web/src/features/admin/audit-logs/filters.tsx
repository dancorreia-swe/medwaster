import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface AuditLogFiltersProps {
  filters: {
    page: number;
    limit: number;
    eventType: string;
    userId: string;
    startDate: string;
    endDate: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

const EVENT_TYPES = [
  { value: "login_success", label: "Login Sucesso" },
  { value: "login_failure", label: "Login Falha" },
  { value: "logout", label: "Logout" },
  { value: "password_reset_requested", label: "Reset Senha Solicitado" },
  { value: "password_reset_completed", label: "Reset Senha Concluído" },
  { value: "user_created", label: "Usuário Criado" },
  { value: "user_updated", label: "Usuário Atualizado" },
  { value: "user_role_changed", label: "Papel Alterado" },
  { value: "audit_log_accessed", label: "Log Auditoria Acessado" },
  { value: "audit_log_exported", label: "Log Auditoria Exportado" },
];

export function AuditLogFilters({ filters, onFiltersChange }: AuditLogFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: 50,
      eventType: "",
      userId: "",
      startDate: "",
      endDate: "",
      search: "",
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "page" || key === "limit") return false;
    return value && value !== "";
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <Label htmlFor="search" className="text-sm font-medium">
            Buscar
          </Label>
          <Input
            id="search"
            placeholder="Buscar em eventos..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {/* Event Type */}
        <div>
          <Label htmlFor="eventType" className="text-sm font-medium">
            Tipo de Evento
          </Label>
          <Select
            value={filters.eventType}
            onValueChange={(value) => updateFilter("eventType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os eventos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os eventos</SelectItem>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User ID */}
        <div>
          <Label htmlFor="userId" className="text-sm font-medium">
            ID do Usuário
          </Label>
          <Input
            id="userId"
            placeholder="user_123..."
            value={filters.userId}
            onChange={(e) => updateFilter("userId", e.target.value)}
          />
        </div>

        {/* Start Date */}
        <div>
          <Label htmlFor="startDate" className="text-sm font-medium">
            Data Inicial
          </Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter("startDate", e.target.value)}
          />
        </div>

        {/* End Date */}
        <div>
          <Label htmlFor="endDate" className="text-sm font-medium">
            Data Final
          </Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter("endDate", e.target.value)}
          />
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
            disabled={!hasActiveFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="text-sm text-slate-600">
          <strong>Filtros ativos:</strong>{" "}
          {filters.eventType && (
            <span className="inline-flex items-center gap-1 mr-2">
              Evento: {EVENT_TYPES.find(t => t.value === filters.eventType)?.label}
            </span>
          )}
          {filters.userId && (
            <span className="inline-flex items-center gap-1 mr-2">
              Usuário: {filters.userId}
            </span>
          )}
          {filters.startDate && (
            <span className="inline-flex items-center gap-1 mr-2">
              De: {filters.startDate}
            </span>
          )}
          {filters.endDate && (
            <span className="inline-flex items-center gap-1 mr-2">
              Até: {filters.endDate}
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 mr-2">
              Busca: "{filters.search}"
            </span>
          )}
        </div>
      )}
    </div>
  );
}