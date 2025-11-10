import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { quizQueryOptions } from "../api/quizzesQueries";
import { useDeleteQuiz, useArchiveQuiz, type QuizDetail as QuizDetailType } from "../api/quizzesApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  FolderOpen,
  MoreVertical,
  Trash2,
  Archive,
  Clock,
  Target,
  FileQuestion,
  Eye,
  Award,
  Users,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { stripHtml } from "@/lib/utils";

interface QuizDetailProps {
  quizId: number;
  onBack: () => void;
}

const DIFFICULTY_LABELS = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
  mixed: "Misto",
};

const STATUS_LABELS = {
  draft: "Rascunho",
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
};

export function QuizDetail({ quizId, onBack }: QuizDetailProps) {
  const navigate = useNavigate();
  const { data: quiz, isLoading, error } = useQuery(quizQueryOptions(quizId));
  const deleteQuiz = useDeleteQuiz();
  const archiveQuiz = useArchiveQuiz();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteQuiz.mutateAsync(quizId);
      toast.success("Quiz excluído com sucesso!");
      navigate({ to: "/quizzes" });
    } catch (error) {
      toast.error("Erro ao excluir quiz. Tente novamente.");
      console.error("Error deleting quiz:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveQuiz.mutateAsync(quizId);
      toast.success("Quiz arquivado com sucesso!");
    } catch (error) {
      toast.error("Erro ao arquivar quiz. Tente novamente.");
      console.error("Error archiving quiz:", error);
    }
  };

  if (isLoading) {
    return <QuizDetailSkeleton />;
  }

  if (error || !quiz) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar quiz. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const typedQuiz = quiz as any;
  const questions = typedQuiz.questions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            {/* Title and primary badges */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="text-2xl font-bold lg:text-3xl">{typedQuiz.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    typedQuiz.difficulty === "advanced"
                      ? "destructive"
                      : typedQuiz.difficulty === "intermediate"
                        ? "default"
                        : "secondary"
                  }
                  className="text-xs font-medium"
                >
                  {DIFFICULTY_LABELS[typedQuiz.difficulty as keyof typeof DIFFICULTY_LABELS]}
                </Badge>
                <Badge
                  variant={
                    typedQuiz.status === "active"
                      ? "default"
                      : typedQuiz.status === "draft"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {STATUS_LABELS[typedQuiz.status as keyof typeof STATUS_LABELS]}
                </Badge>
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {typedQuiz.createdAt ? format(new Date(typedQuiz.createdAt), "dd/MM/yyyy") : "N/A"}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <FileQuestion className="h-4 w-4" />
                {questions.length} questõ{questions.length !== 1 ? "es" : "ão"}
              </span>
            </div>

            {/* Category */}
            {typedQuiz.category && (
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: typedQuiz.category.color ? `${typedQuiz.category.color}20` : undefined,
                    borderColor: typedQuiz.category.color || undefined,
                    color: typedQuiz.category.color || undefined,
                  }}
                  className="text-xs font-medium"
                >
                  {typedQuiz.category.name}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => navigate({ to: "/quizzes/$quizId/edit", params: { quizId: quizId.toString() } })}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {typedQuiz.status !== "archived" && (
                  <>
                    <DropdownMenuItem onClick={handleArchive}>
                      <Archive className="mr-2 h-4 w-4" />
                      Arquivar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Separator />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O quiz "{typedQuiz.title}" será permanentemente excluído do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {typedQuiz.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{typedQuiz.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {typedQuiz.instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Instruções</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{typedQuiz.instructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5" />
                Questões ({questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questions.length > 0 ? (
                <div className="space-y-3">
                  {questions.map((q: any, index: number) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {stripHtml(q.question?.prompt || "Sem título")}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {q.points} ponto{q.points !== 1 ? "s" : ""}
                          </Badge>
                          {q.required && (
                            <Badge variant="secondary" className="text-xs">
                              Obrigatória
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileQuestion className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma questão adicionada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author */}
          {typedQuiz.author && (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              {typedQuiz.author.image && (
                <img
                  src={typedQuiz.author.image}
                  alt={typedQuiz.author.name}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-sm">{typedQuiz.author.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Autor
                </p>
              </div>
            </div>
          )}

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo limite
                </span>
                <span className="font-medium">
                  {typedQuiz.timeLimit ? `${typedQuiz.timeLimit} min` : "Sem limite"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tentativas máximas
                </span>
                <span className="font-medium">
                  {typedQuiz.maxAttempts || "Ilimitado"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Nota de aprovação
                </span>
                <span className="font-medium">{typedQuiz.passingScore || 70}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Mostrar resultados
                </span>
                <span className="font-medium">
                  {typedQuiz.showResults ? "Sim" : "Não"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Respostas corretas</span>
                <span className="font-medium">
                  {typedQuiz.showCorrectAnswers ? "Sim" : "Não"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ordem aleatória</span>
                <span className="font-medium">
                  {typedQuiz.randomizeQuestions ? "Sim" : "Não"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {typedQuiz.createdAt
                    ? format(new Date(typedQuiz.createdAt), "dd/MM/yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">
                  {typedQuiz.updatedAt
                    ? format(new Date(typedQuiz.updatedAt), "dd/MM/yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuizDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Separator />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
