import { useQuery } from "@tanstack/react-query";
import {
  userTrailsQueryOptions,
} from "../api/usersQueries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Route as TrailIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { UserTrailProgressItem } from "../types";

interface UserTrailsTabProps {
  userId: string;
  enabled: boolean;
}

const difficultyLabels: Record<string, string> = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export function UserTrailsTab({ userId, enabled }: UserTrailsTabProps) {
  const trailsQuery = useQuery({
    ...userTrailsQueryOptions(userId),
    enabled,
  });

  if (!enabled && trailsQuery.status === "pending") {
    return null;
  }

  if (trailsQuery.isLoading) {
    return (
      <div className="min-h-[200px] rounded-md border border-border bg-card">
        <Loader />
      </div>
    );
  }

  if (trailsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar trilhas</AlertTitle>
        <AlertDescription>
          {trailsQuery.error instanceof Error
            ? trailsQuery.error.message
            : "Não foi possível carregar o progresso em trilhas."}
        </AlertDescription>
      </Alert>
    );
  }

  const trails = (trailsQuery.data ?? []) as UserTrailProgressItem[];

  if (trails.length === 0) {
    return (
      <Empty className="border border-dashed py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrailIcon />
          </EmptyMedia>
          <EmptyTitle>Nenhuma trilha encontrada</EmptyTitle>
          <EmptyDescription>
            O usuário ainda não iniciou trilhas ou não possui progresso registrado.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const formatMinutes = (minutes: number) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trilha</TableHead>
            <TableHead>Dificuldade</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tempo</TableHead>
            <TableHead>Último acesso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trails.map((item) => {
            const difficulty = difficultyLabels[item.difficulty] || item.difficulty;
            const statusBadge = item.isCompleted
              ? { variant: "default" as const, label: "Concluída" }
              : item.isEnrolled
              ? { variant: "secondary" as const, label: "Em andamento" }
              : { variant: "outline" as const, label: "Desbloqueada" };

            return (
              <TableRow key={item.trailId}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.code}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {difficulty}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress value={item.progressPercentage} className="h-1.5" />
                    <div className="text-xs text-muted-foreground">
                      {item.progressPercentage}% • {item.completedContent}/{item.totalContent}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadge.variant} className="gap-1">
                    {statusBadge.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatMinutes(item.timeSpentMinutes)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {item.lastAccessedAt ? formatDate(item.lastAccessedAt) : "—"}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
