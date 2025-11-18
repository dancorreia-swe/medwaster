import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Edit,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  Users,
  Trophy,
  Calendar,
  Lock,
  BookOpen,
  HelpCircle,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Trail, TrailContent } from "../types";
import { stripHtml } from "@/lib/utils";
import {
  useArchiveTrail,
  useDeleteTrail,
  usePublishTrail,
} from "../api/trailsQueries";
import { toast } from "sonner";

interface TrailDetailPageProps {
  trail: Trail;
  isLoading?: boolean;
}

const difficultyConfig = {
  basic: { label: "Básico", variant: "secondary" as const },
  intermediate: { label: "Intermediário", variant: "default" as const },
  advanced: { label: "Avançado", variant: "destructive" as const },
};

const statusConfig = {
  draft: { label: "Rascunho", variant: "secondary" as const },
  published: { label: "Publicado", variant: "default" as const },
  inactive: { label: "Inativo", variant: "outline" as const },
  archived: { label: "Arquivado", variant: "destructive" as const },
};

export function TrailDetailPage({ trail, isLoading }: TrailDetailPageProps) {
  const navigate = useNavigate();
  const archiveMutation = useArchiveTrail();
  const deleteMutation = useDeleteTrail();
  const publishMutation = usePublishTrail();

  const difficulty = difficultyConfig[trail.difficulty];
  const status = statusConfig[trail.status];

  const handleEdit = (tab?: string) => {
    navigate({
      to: "/trails/$trailId/edit",
      params: { trailId: trail.id.toString() },
      search: tab ? { tab } : undefined,
    });
  };

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(trail.id);
      toast.success("Trilha arquivada com sucesso!");
    } catch (error) {
      console.error("Error archiving trail:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir a trilha "${trail.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(trail.id);
        toast.success("Trilha excluída com sucesso!");
        navigate({ to: "/trails" });
      } catch (error) {
        console.error("Error deleting trail:", error);
      }
    }
  };

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync(trail.id);
      toast.success("Trilha publicada com sucesso!");
    } catch (error) {
      console.error("Error publishing trail:", error);
    }
  };

  if (isLoading) {
    return <TrailDetailSkeleton />;
  }

  const contentCount = trail.content?.length || 0;
  const prerequisiteCount = trail.prerequisites?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/trails" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{trail.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
              {trail.unlockOrder && (
                <Badge variant="outline">Ordem #{trail.unlockOrder}</Badge>
              )}
            </div>
            {trail.description && (
              <p className="text-muted-foreground mt-2">{trail.description}</p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {trail.status === "draft" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePublish}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Publicar
                </DropdownMenuItem>
              </>
            )}
            {trail.status !== "archived" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Metadata Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conteúdos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentCount}</div>
            <p className="text-xs text-muted-foreground">
              {contentCount === 1 ? "item" : "itens"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscritos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trail.enrolledCount}</div>
            <p className="text-xs text-muted-foreground">usuários ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trail.passPercentage}%</div>
            <p className="text-xs text-muted-foreground">de aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Estimado</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trail.estimatedTimeMinutes || "-"}
            </div>
            <p className="text-xs text-muted-foreground">minutos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trail Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conteúdo da Trilha</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {contentCount} {contentCount === 1 ? "item" : "itens"} nesta trilha
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit("content")}>
                  <Edit className="mr-2 h-4 w-4" />
                  Gerenciar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!trail.content || trail.content.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum conteúdo adicionado ainda</p>
                  <p className="text-xs mt-1">
                    Clique em "Gerenciar" para adicionar conteúdo
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trail.content.map((content, index) => (
                    <ContentItem
                      key={content.id}
                      content={content}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prerequisites */}
          {prerequisiteCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Pré-requisitos
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Trilhas que devem ser completadas antes
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trail.prerequisites?.map((prereq) => (
                    <div
                      key={prereq.prerequisiteTrailId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {prereq.prerequisiteTrail?.name || "Trilha desconhecida"}
                        </span>
                      </div>
                      {prereq.prerequisiteTrail && (
                        <Badge
                          variant={
                            difficultyConfig[prereq.prerequisiteTrail.difficulty]
                              ?.variant || "outline"
                          }
                        >
                          {difficultyConfig[prereq.prerequisiteTrail.difficulty]
                            ?.label || prereq.prerequisiteTrail.difficulty}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trail Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trail.category && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Categoria
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {trail.category.name}
                  </Badge>
                </div>
              )}

              {trail.author && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Autor</p>
                  <p className="text-sm mt-1">{trail.author.name}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="font-medium">
                    {new Date(trail.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Atualizado em:</span>
                  <span className="font-medium">
                    {new Date(trail.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tentativas permitidas</span>
                <span className="font-medium">{trail.attemptsAllowed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nota mínima</span>
                <span className="font-medium">{trail.passPercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Explicações imediatas</span>
                <Badge variant={trail.showImmediateExplanations ? "default" : "outline"}>
                  {trail.showImmediateExplanations ? "Sim" : "Não"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Permitir pular questões</span>
                <Badge variant={trail.allowSkipQuestions ? "default" : "outline"}>
                  {trail.allowSkipQuestions ? "Sim" : "Não"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ordem aleatória</span>
                <Badge variant={trail.randomizeContentOrder ? "default" : "outline"}>
                  {trail.randomizeContentOrder ? "Sim" : "Não"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Taxa de conclusão</span>
                <span className="font-medium">{trail.completionRate}%</span>
              </div>
              {trail.averageCompletionMinutes && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tempo médio</span>
                  <span className="font-medium">
                    {trail.averageCompletionMinutes} min
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ContentItem({ content, index }: { content: TrailContent; index: number }) {
  const getContentIcon = () => {
    if (content.questionId) return <HelpCircle className="h-4 w-4" />;
    if (content.quizId) return <BookOpen className="h-4 w-4" />;
    if (content.articleId) return <FileText className="h-4 w-4" />;
    return null;
  };

  const getContentTitle = () => {
    if (content.question) return stripHtml(content.question.prompt);
    if (content.quiz) return stripHtml(content.quiz.title);
    if (content.article) return stripHtml(content.article.title);
    return "Conteúdo desconhecido";
  };

  const getContentType = () => {
    if (content.questionId) return "Questão";
    if (content.quizId) return "Quiz";
    if (content.articleId) return "Artigo";
    return "Desconhecido";
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
        {index + 1}
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {getContentIcon()}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{getContentTitle()}</p>
          <p className="text-xs text-muted-foreground">{getContentType()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={content.isRequired ? "default" : "outline"} className="text-xs">
          {content.isRequired ? "Obrigatório" : "Opcional"}
        </Badge>
      </div>
    </div>
  );
}

function TrailDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-10" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
