import { useQuery } from "@tanstack/react-query";
import {
  userAchievementsQueryOptions,
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
import { Trophy } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { UserAchievementDetail } from "../types";

interface UserAchievementsTabProps {
  userId: string;
  enabled: boolean;
}

export function UserAchievementsTab({ userId, enabled }: UserAchievementsTabProps) {
  const achievementsQuery = useQuery({
    ...userAchievementsQueryOptions(userId),
    enabled,
  });

  if (!enabled && achievementsQuery.status === "pending") {
    return null;
  }

  if (achievementsQuery.isLoading) {
    return (
      <div className="min-h-[200px] rounded-md border border-border bg-card">
        <Loader />
      </div>
    );
  }

  if (achievementsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar conquistas</AlertTitle>
        <AlertDescription>
          {achievementsQuery.error instanceof Error
            ? achievementsQuery.error.message
            : "Não foi possível carregar as conquistas do usuário."}
        </AlertDescription>
      </Alert>
    );
  }

  const achievements = (achievementsQuery.data ?? []) as UserAchievementDetail[];

  if (achievements.length === 0) {
    return (
      <Empty className="border border-dashed py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Trophy />
          </EmptyMedia>
          <EmptyTitle>Sem conquistas registradas</EmptyTitle>
          <EmptyDescription>
            Este usuário ainda não possui conquistas atribuídas ou progresso registrado.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conquista</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Dificuldade</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Atualizado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {achievements.map((item) => {
            const statusLabel = item.isUnlocked ? "Desbloqueada" : "Em progresso";

            return (
            <TableRow key={`${item.achievementId}-${item.updatedAt}`}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.slug}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs uppercase">
                  {item.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs capitalize">
                  {item.difficulty}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Progress value={item.progressPercentage} className="h-1.5" />
                  <div className="text-xs text-muted-foreground">
                    {item.progressPercentage.toFixed(0)}% • {item.currentValue} / {item.targetValue}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={item.isUnlocked ? "default" : "secondary"} className="gap-1">
                  {statusLabel}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {item.updatedAt ? formatDate(item.updatedAt) : "—"}
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
