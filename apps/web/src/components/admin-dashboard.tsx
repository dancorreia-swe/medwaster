import { useEffect } from "react";
import { toast } from "sonner";
import { AdminOnly, usePermissions } from "@/components/auth/role-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, FileText, TrendingUp } from "lucide-react";
import { getRoleDisplayName } from "@/lib/rbac";
import { Link, useSearch } from "@tanstack/react-router";
import { client } from "@/lib/client";

export function Dashboard() {
  const { user, canAccessSuperAdmin } = usePermissions();
  const search = useSearch({ strict: false });

  useEffect(() => {
    if (search.error === "insufficient_permissions" && search.message) {
      toast.error(search.message);
    }
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Bem-vindo, {user?.name || "Usuário"}!
          </h1>
          <p className="text-slate-600 mt-1">
            Acesso ao painel do MedWaster Learning
          </p>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Minhas Questões
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Questões respondidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Taxa de acerto</p>
          </CardContent>
        </Card>

        {/* Admin Stats - Only visible to admins */}
        <AdminOnly hideOnNoAccess>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Usuários ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Eventos de Segurança
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Últimas 24h</p>
            </CardContent>
          </Card>
        </AdminOnly>
      </div>

      {/* Admin Quick Actions */}
      <AdminOnly hideOnNoAccess>
        <Card>
          <CardHeader>
            <CardTitle>Ações Administrativas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades administrativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/admin/audit-logs"
                className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Shield className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-medium">Logs de Auditoria</h3>
                  <p className="text-sm text-slate-600">
                    Visualizar eventos de segurança
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50 opacity-50">
                <Users className="h-8 w-8 text-slate-400" />
                <div>
                  <h3 className="font-medium text-slate-500">
                    Gerenciar Usuários
                  </h3>
                  <p className="text-sm text-slate-400">Em breve</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </AdminOnly>
    </div>
  );
}
