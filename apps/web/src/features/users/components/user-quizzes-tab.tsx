import { useQuery } from "@tanstack/react-query";
import {
  userQuizzesQueryOptions,
} from "../api/usersQueries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { UserQuizAttemptItem } from "../types";

interface UserQuizzesTabProps {
  userId: string;
  enabled: boolean;
}

const difficultyLabels: Record<string, string> = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
  mixed: "Misto",
};

export function UserQuizzesTab({ userId, enabled }: UserQuizzesTabProps) {
  const quizzesQuery = useQuery({
    ...userQuizzesQueryOptions(userId),
    enabled,
  });

  if (!enabled && quizzesQuery.status === "pending") {
    return null;
  }

  if (quizzesQuery.isLoading) {
    return (
      <div className="min-h-[200px] rounded-md border border-border bg-card">
        <Loader />
      </div>
    );
  }

  if (quizzesQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar quizzes</AlertTitle>
        <AlertDescription>
          {quizzesQuery.error instanceof Error
            ? quizzesQuery.error.message
            : "Não foi possível carregar os quizzes realizados pelo usuário."}
        </AlertDescription>
      </Alert>
    );
  }

  const attempts = (quizzesQuery.data ?? []) as UserQuizAttemptItem[];

  if (attempts.length === 0) {
    return (
      <Empty className="border border-dashed py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BrainCircuit />
          </EmptyMedia>
          <EmptyTitle>Sem tentativas registradas</EmptyTitle>
          <EmptyDescription>
            O usuário ainda não realizou quizzes ou não possui tentativas registradas.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const formatScore = (score: number | null, passingScore: number | null) => {
    if (score === null || passingScore === null) return "—";
    const passed = score >= passingScore;
    return `${score}% / ${passingScore}% ${passed ? "✓" : "✗"}`;
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quiz</TableHead>
            <TableHead>Dificuldade</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tempo</TableHead>
            <TableHead>Concluído em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => {
            const difficulty = difficultyLabels[attempt.difficulty] || attempt.difficulty;
            const statusVariant = attempt.status === "completed" ? "default" : "secondary";

            return (
              <TableRow key={attempt.attemptId}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{attempt.title}</span>
                    <span className="text-xs text-muted-foreground">ID {attempt.quizId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {difficulty}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatScore(attempt.score, attempt.passingScore)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant} className="capitalize">
                    {attempt.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(attempt.timeSpentSeconds)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {attempt.completedAt ? formatDate(attempt.completedAt) : "—"}
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
