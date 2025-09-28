import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditLogFilters } from "./filters";
import { toast } from "sonner";

interface AuditLogEntry {
  id: string;
  eventType: string;
  userId: string | null;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  resourceType: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  additionalContext?: any;
}

interface AuditLogListProps {
  baseURL: string;
}

export function AuditLogList({ baseURL }: AuditLogListProps) {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    eventType: "",
    userId: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${baseURL}/api/admin/audit-logs?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth-token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      return response.json();
    },
  });

  const handleExport = async (format: "csv" | "json") => {
    try {
      const exportData = {
        format,
        filters: {
          eventType: filters.eventType || undefined,
          userId: filters.userId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          search: filters.search || undefined,
        },
        maxRecords: 10000,
      };

      const response = await fetch(`${baseURL}/api/admin/audit-logs/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error("Failed to export audit logs");
      }

      const result = await response.json();
      toast.success(`Export started! ${result.recordCount} records will be exported.`);
    } catch (error) {
      toast.error("Failed to export audit logs");
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "login_success":
        return "bg-green-100 text-green-800";
      case "login_failure":
        return "bg-red-100 text-red-800";
      case "password_reset_requested":
      case "password_reset_completed":
        return "bg-blue-100 text-blue-800";
      case "user_created":
        return "bg-purple-100 text-purple-800";
      case "user_role_changed":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-sm text-red-500">
            Erro ao carregar logs de auditoria: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logs de Auditoria</h1>
          <p className="text-sm text-slate-600">
            Visualize e analise todos os eventos de segurança do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleExport("csv")} 
            variant="outline"
            size="sm"
          >
            Exportar CSV
          </Button>
          <Button 
            onClick={() => handleExport("json")} 
            variant="outline"
            size="sm"
          >
            Exportar JSON
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogFilters 
            filters={filters} 
            onFiltersChange={setFilters} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Eventos de Auditoria 
            {data?.pagination?.total && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({data.pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-500">Carregando...</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Contexto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((log: AuditLogEntry) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge 
                          className={getEventTypeColor(log.eventType)}
                          variant="secondary"
                        >
                          {log.eventType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="font-medium">{log.user.name}</div>
                            <div className="text-xs text-slate-500">
                              {log.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.timestamp), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(log.timestamp), "HH:mm:ss", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                          {log.ipAddress || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>
                        {log.additionalContext && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                              Ver detalhes
                            </summary>
                            <pre className="mt-1 text-xs bg-slate-50 p-2 rounded max-w-xs overflow-auto">
                              {JSON.stringify(log.additionalContext, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data?.pagination && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-slate-600">
                    Página {data.pagination.page} de {data.pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!data.pagination.hasPrevPage}
                      variant="outline"
                      size="sm"
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!data.pagination.hasNextPage}
                      variant="outline"
                      size="sm"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}