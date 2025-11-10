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
import {
  BookOpen,
  Users,
  FileQuestion,
  TrendingUp,
  ClipboardList,
  Route,
  FolderTree,
  BookText,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Link, useSearch } from "@tanstack/react-router";
import { client } from "@/lib/client";
import { useQuery } from "@tanstack/react-query";

export function Dashboard() {
  const { user, isAdmin } = usePermissions();
  const search = useSearch({ strict: false });

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await client.dashboard.stats.get();
      if (response.error) throw response.error;
      return response.data;
    },
  });

  useEffect(() => {
    if (search.error === "insufficient_permissions" && search.message) {
      toast.error(search.message);
    }
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Bem-vindo, {user?.name || "Usuário"}!
        </h1>
        <p className="text-slate-600 mt-1">
          Painel de controle do MedWaster Learning
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminOnly hideOnNoAccess>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "-" : stats?.users.active || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {isLoading ? "-" : stats?.users.total || 0}
              </p>
            </CardContent>
          </Card>
        </AdminOnly>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questões</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "-" : stats?.questions.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "-" : stats?.questions.recentlyCreated || 0} criadas
              esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "-" : stats?.quizzes.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "-" : stats?.quizzes.recentlyCreated || 0} criados
              esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trilhas</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "-" : stats?.trails.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de trilhas disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Create Actions */}
      <AdminOnly hideOnNoAccess>
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Criar novo conteúdo rapidamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/questions/new"
                className="group flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Plus className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Nova Questão
                  </h3>
                  <p className="text-xs text-slate-600">Criar questão</p>
                </div>
              </Link>

              <Link
                to="/quizzes/create"
                className="group flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-white hover:bg-green-50 hover:border-green-300 transition-all"
              >
                <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Plus className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Novo Quiz
                  </h3>
                  <p className="text-xs text-slate-600">Criar avaliação</p>
                </div>
              </Link>

              <Link
                to="/trails/create"
                className="group flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all"
              >
                <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <Plus className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Nova Trilha
                  </h3>
                  <p className="text-xs text-slate-600">Criar trilha</p>
                </div>
              </Link>

              <Link
                to="/achievements/$achievementId"
                params={{ achievementId: "new" }}
                className="group flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-white hover:bg-yellow-50 hover:border-yellow-300 transition-all"
              >
                <div className="p-2 rounded-lg bg-yellow-100 group-hover:bg-yellow-200 transition-colors">
                  <Plus className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Nova Conquista
                  </h3>
                  <p className="text-xs text-slate-600">Criar conquista</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </AdminOnly>

      {/* Additional Content Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Overview Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Visão Geral do Conteúdo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Total de questões</span>
              </div>
              <span className="font-medium">
                {isLoading ? "-" : stats?.questions.total || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Total de quizzes</span>
              </div>
              <span className="font-medium">
                {isLoading ? "-" : stats?.quizzes.total || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Trilhas de aprendizado</span>
              </div>
              <span className="font-medium">
                {isLoading ? "-" : stats?.trails.total || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Categorias</span>
              </div>
              <span className="font-medium">
                {isLoading ? "-" : stats?.categories.total || 0}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <span className="text-sm text-slate-600">Artigos Wiki</span>
              </div>
              <span className="font-medium text-indigo-600">
                {isLoading ? "-" : stats?.wiki.total || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Activity This Week */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Atividade desta Semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileQuestion className="h-4 w-4 text-blue-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {isLoading ? "-" : stats?.questions.recentlyCreated || 0} novas questões
                </p>
                <p className="text-xs text-slate-600">Criadas nos últimos 7 dias</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <div className="p-2 rounded-lg bg-green-100">
                <ClipboardList className="h-4 w-4 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {isLoading ? "-" : stats?.quizzes.recentlyCreated || 0} novos quizzes
                </p>
                <p className="text-xs text-slate-600">Criados nos últimos 7 dias</p>
              </div>
            </div>

            <AdminOnly hideOnNoAccess>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="h-4 w-4 text-purple-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {isLoading ? "-" : stats?.users.active || 0} usuários ativos
                  </p>
                  <p className="text-xs text-slate-600">Últimos 30 dias</p>
                </div>
              </div>
            </AdminOnly>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
