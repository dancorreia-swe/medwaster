import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { UserForm } from "./user-form";
import { userOverviewQueryOptions } from "../api/usersQueries";
import type { UserOverview } from "../types";
import { formatDate } from "@/lib/utils";
import { MailCheck, MailX } from "lucide-react";
import { UserAchievementsTab } from "./user-achievements-tab";
import { UserTrailsTab } from "./user-trails-tab";
import { UserQuizzesTab } from "./user-quizzes-tab";

interface UserDetailPageProps {
  userId: string;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  "super-admin": "Super Admin",
};

export function UserDetailPage({ userId }: UserDetailPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const overviewQuery = useQuery(userOverviewQueryOptions(userId));

  const overview = overviewQuery.data as UserOverview | undefined;

  const user = overview?.user;

  const initials = useMemo(() => {
    if (!user) return "";
    return user.name
      .split(" ")
      .map((segment) => segment.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const lastActivity = overview?.stats.lastActivityAt
    ? formatDate(overview.stats.lastActivityAt)
    : "—";

  if (overviewQuery.isLoading) {
    return (
      <div className="min-h-[300px] rounded-md border border-border bg-card">
        <Loader />
      </div>
    );
  }

  if (overviewQuery.isError || !overview || !user) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar usuário</AlertTitle>
        <AlertDescription>
          {overviewQuery.error instanceof Error
            ? overviewQuery.error.message
            : "Não foi possível carregar os dados do usuário."}
        </AlertDescription>
      </Alert>
    );
  }

  const handleEditClick = () => {
    setIsEditOpen(true);
  };

  const verifiedBadge = user.emailVerified ? (
    <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
      <MailCheck className="h-3 w-3" /> Verificado
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1">
      <MailX className="h-3 w-3" /> Não verificado
    </Badge>
  );

  const roleLabel = user.role ? roleLabels[user.role] || user.role : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">
                  {user.name}
                </h1>
                {user.banned && (
                  <Badge variant="destructive">Banido</Badge>
                )}
                {roleLabel && (
                  <Badge variant="outline" className="uppercase tracking-wide text-xs">
                    {roleLabel}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{user.email}</span>
                {verifiedBadge}
                <Separator orientation="vertical" className="h-4" />
                <span>
                  Cadastro em {formatDate(user.createdAt)}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>Última atividade: {lastActivity}</span>
              </div>
              {user.banned && user.banReason && (
                <p className="text-sm text-destructive/80">
                  Motivo: {user.banReason}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditClick}>
              Editar usuário
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="trails">Trilhas</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Conquistas acompanhadas"
              value={overview.stats.achievements.tracked}
              description={`${overview.stats.achievements.unlocked} desbloqueadas • ${overview.stats.achievements.inProgress} em progresso`}
            />
            <StatCard
              title="Progresso médio em conquistas"
              value={`${overview.stats.achievements.averageProgress.toFixed(0)}%`}
              description="Média considerando todas as conquistas rastreadas"
            />
            <StatCard
              title="Trilhas"
              value={`${overview.stats.trails.completed}/${overview.stats.trails.enrolled}`}
              description={`${overview.stats.trails.timeSpentMinutes} min dedicados`}
            />
            <StatCard
              title="Quizzes"
              value={`${overview.stats.quizzes.attempts}`}
              description={`Média ${overview.stats.quizzes.averageScore.toFixed(1)}% • ${overview.stats.quizzes.passed} aprov.`}
            />
          </div>

          <Card>
            <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Resumo de conquistas
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>Desbloqueadas: {overview.stats.achievements.unlocked}</li>
                  <li>Em progresso: {overview.stats.achievements.inProgress}</li>
                  <li>Progresso médio: {overview.stats.achievements.averageProgress.toFixed(1)}%</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Engajamento recente
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>Última trilha acessada: {overview.stats.trails.lastAccessedAt ? formatDate(overview.stats.trails.lastAccessedAt) : "—"}</li>
                  <li>Último quiz: {overview.stats.quizzes.lastAttemptAt ? formatDate(overview.stats.quizzes.lastAttemptAt) : "—"}</li>
                  <li>Última atividade geral: {lastActivity}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <UserAchievementsTab userId={userId} enabled={activeTab === "achievements"} />
        </TabsContent>

        <TabsContent value="trails">
          <UserTrailsTab userId={userId} enabled={activeTab === "trails"} />
        </TabsContent>

        <TabsContent value="quizzes">
          <UserQuizzesTab userId={userId} enabled={activeTab === "quizzes"} />
        </TabsContent>
      </Tabs>

      <UserForm userId={userId} open={isEditOpen} onOpenChange={setIsEditOpen} />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
