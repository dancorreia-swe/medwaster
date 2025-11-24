import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { UserForm } from "./user-form";
import { userOverviewQueryOptions, usersQueryKeys } from "../api/usersQueries";
import { usersApi } from "../api/usersApi";
import type { UserOverview } from "../types";
import { formatDate } from "@/lib/utils";
import {
  MailCheck,
  MailX,
  Award,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { UserAchievementsTab } from "./user-achievements-tab";
import { UserTrailsTab } from "./user-trails-tab";
import { UserQuizzesTab } from "./user-quizzes-tab";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

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
  const certificate = overview.certificate;
  const certificateUrl = certificate?.certificateUrl
    ? certificate.certificateUrl.startsWith("http")
      ? certificate.certificateUrl
      : `${import.meta.env.VITE_SERVER_URL}${certificate.certificateUrl}`
    : null;

  const regenerateCertificate = useMutation({
    mutationFn: () => usersApi.regenerateCertificate(userId),
    onSuccess: () => {
      toast.success("Certificado regenerado com sucesso!");
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.overview(userId),
      });
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Falha ao regenerar certificado";
      toast.error(message);
    },
  });

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
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Certificado
                  </h3>
                  {certificate ? (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <CertificateBadge status={certificate.status} />
                      <p>
                        Código:&nbsp;
                        <span className="font-mono text-base text-foreground">
                          {certificate.verificationCode}
                        </span>
                      </p>
                      {certificate.issuedAt && (
                        <p>
                          Emitido em {formatDate(certificate.issuedAt)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Este usuário ainda não possui certificado.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {certificateUrl && (
                    <Button asChild variant="outline" className="gap-2">
                      <a href={certificateUrl} target="_blank" rel="noreferrer">
                        <LinkIcon className="h-4 w-4" /> Ver PDF
                      </a>
                    </Button>
                  )}
                  {certificate && (
                    <Button asChild variant="ghost" className="gap-2">
                      <Link
                        to="/verify/certificate/$code"
                        params={{ code: certificate.verificationCode }}
                        target="_blank"
                      >
                        <LinkIcon className="h-4 w-4" /> Página pública
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => regenerateCertificate.mutate()}
                    disabled={regenerateCertificate.isPending}
                  >
                    {regenerateCertificate.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Regenerando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        {certificate ? "Regerar certificado" : "Gerar certificado"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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

const certificateStatusStyles: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Em revisão",
    className: "border-yellow-200 bg-yellow-50 text-yellow-900",
  },
  approved: {
    label: "Certificado liberado",
    className: "border-green-200 bg-green-50 text-green-900",
  },
  rejected: {
    label: "Rejeitado",
    className: "border-red-200 bg-red-50 text-red-900",
  },
  revoked: {
    label: "Revogado",
    className: "border-red-200 bg-red-50 text-red-900",
  },
};

function CertificateBadge({ status }: { status: string }) {
  const config = certificateStatusStyles[status] ?? certificateStatusStyles.pending;
  return (
    <Badge
      variant="outline"
      className={`text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}
