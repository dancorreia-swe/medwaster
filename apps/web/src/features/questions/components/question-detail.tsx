import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { questionQueryOptions } from "../api/questionsQueries";
import { useDeleteQuestion } from "../api/questionsApi";
import type { QuestionDetail as QuestionDetailType } from "../api/questionsApi";
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
  Tag,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  QUESTION_TYPE_LABELS,
  QUESTION_DIFFICULTY_LABELS,
  QUESTION_STATUS_LABELS,
  type QuestionType,
  type QuestionDifficulty,
  type QuestionStatus,
} from "../types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuestionDetailProps {
  questionId: number;
  onBack: () => void;
}

export function QuestionDetail({ questionId, onBack }: QuestionDetailProps) {
  const navigate = useNavigate();
  const { data: question, isLoading, error } = useQuery(questionQueryOptions(questionId));
  const deleteQuestion = useDeleteQuestion();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteQuestion.mutateAsync(questionId);
      navigate({ to: "/questions" });
    } catch (error) {
      // Error is already handled by the mutation hook
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return <QuestionDetailSkeleton />;
  }

  if (error || !question) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar questão. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const typedQuestion = question as QuestionDetailType;

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
            {/* Title */}
            <h1 className="text-2xl font-bold lg:text-3xl">Questão #{typedQuestion.id}</h1>

            {/* Metadata and badges row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <Badge
                variant={
                  typedQuestion.status === "active"
                    ? "default"
                    : typedQuestion.status === "draft"
                      ? "secondary"
                      : "outline"
                }
                className="text-xs font-medium"
              >
                {QUESTION_STATUS_LABELS[typedQuestion.status as QuestionStatus]}
              </Badge>
              <Badge
                variant={
                  typedQuestion.difficulty === "advanced"
                    ? "destructive"
                    : typedQuestion.difficulty === "intermediate"
                      ? "default"
                      : "secondary"
                }
                className="text-xs font-medium"
              >
                {QUESTION_DIFFICULTY_LABELS[typedQuestion.difficulty as QuestionDifficulty]}
              </Badge>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {typedQuestion.createdAt ? format(new Date(typedQuestion.createdAt), "dd/MM/yyyy") : "N/A"}
              </span>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <span className="text-muted-foreground">{QUESTION_TYPE_LABELS[typedQuestion.type as QuestionType]}</span>
              {(typedQuestion as any).usageCount !== undefined && (
                <>
                  <span className="hidden sm:inline text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{(typedQuestion as any).usageCount} uso{(typedQuestion as any).usageCount !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
            
            {/* Category and Tags */}
            {(typedQuestion.category || (typedQuestion.tags && typedQuestion.tags.length > 0)) && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                {typedQuestion.category && (
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <Badge 
                      variant="secondary" 
                      style={{ 
                        backgroundColor: typedQuestion.category.color ? `${typedQuestion.category.color}20` : undefined,
                        borderColor: typedQuestion.category.color || undefined,
                        color: typedQuestion.category.color || undefined
                      }}
                      className="text-xs font-medium"
                    >
                      {typedQuestion.category.name}
                    </Badge>
                  </div>
                )}
                
                {typedQuestion.tags && typedQuestion.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {typedQuestion.tags.slice(0, 4).map((tagRelation: any) => (
                        <Badge 
                          key={tagRelation.tag.id} 
                          variant="outline"
                          style={{
                            backgroundColor: tagRelation.tag.color ? `${tagRelation.tag.color}10` : undefined,
                            borderColor: tagRelation.tag.color ? `${tagRelation.tag.color}40` : undefined,
                            color: tagRelation.tag.color || undefined
                          }}
                          className="text-xs hover:bg-opacity-20 transition-colors cursor-pointer"
                          title={`Tag: ${tagRelation.tag.name}`}
                        >
                          {tagRelation.tag.name}
                        </Badge>
                      ))}
                      {typedQuestion.tags.length > 4 && (
                        <Badge 
                          variant="outline" 
                          className="text-xs cursor-pointer" 
                          title={`${typedQuestion.tags.length - 4} mais tags`}
                        >
                          +{typedQuestion.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate({ to: "/questions/$questionId/edit", params: { questionId: questionId.toString() } })}>
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
              Esta ação não pode ser desfeita. A questão #{questionId} será permanentemente excluída do banco de dados.
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
          {/* Question Content */}
          <Card>
            <CardHeader>
              <CardTitle>Enunciado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {typedQuestion.imageUrl && (
                <div className="mb-4">
                  <img
                    src={typedQuestion.imageUrl}
                    alt="Imagem da questão"
                    className="max-w-full h-auto rounded-lg border border-border"
                  />
                </div>
              )}
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: typedQuestion.prompt }}
              />
            </CardContent>
          </Card>

          {/* Answer Options */}
          {(typedQuestion.type === "multiple_choice" || typedQuestion.type === "true_false") && (
            <Card>
              <CardHeader>
                <CardTitle>Opções de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {typedQuestion.options?.map((option: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 rounded-lg border p-4 ${
                        option.isCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-950"
                          : ""
                      }`}
                    >
                      {option.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Badge variant="outline" className="font-mono">
                        {option.label}
                      </Badge>
                      <span className={option.isCorrect ? "font-semibold" : ""}>
                        {option.content}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fill in the Blanks */}
          {typedQuestion.type === "fill_in_the_blank" && (
            <Card>
              <CardHeader>
                <CardTitle>Lacunas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {typedQuestion.fillInBlanks?.map((blank: any, index: number) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="font-mono">
                          {`{{${blank.sequence}}}`}
                        </Badge>
                        {blank.placeholder && (
                          <span className="text-sm text-muted-foreground">
                            {blank.placeholder}
                          </span>
                        )}
                      </div>
                      
                      {blank.options && blank.options.length > 0 ? (
                        <div className="space-y-2 mt-3">
                          <p className="text-sm font-medium">Opções:</p>
                          <div className="space-y-1">
                            {blank.options.map((option: any, optIndex: number) => (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-2 text-sm ${
                                  option.isCorrect ? "font-semibold text-green-600" : ""
                                }`}
                              >
                                {option.isCorrect ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                                  {String.fromCharCode(65 + optIndex)}
                                </Badge>
                                <span>{option.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {blank.answer}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matching Pairs */}
          {typedQuestion.type === "matching" && (
            <Card>
              <CardHeader>
                <CardTitle>Pares de Correspondência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {typedQuestion.matchingPairs?.map((pair: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-lg border p-4"
                    >
                      <Badge className="font-mono">{pair.sequence}</Badge>
                      <div className="flex-1">{pair.leftText}</div>
                      <span className="text-muted-foreground">↔</span>
                      <div className="flex-1">{pair.rightText}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Explanation */}
          {typedQuestion.explanation && (
            <Card>
              <CardHeader>
                <CardTitle>Explicação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{typedQuestion.explanation}</p>
              </CardContent>
            </Card>
          )}

          {/* References */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author - Simplified */}
          {typedQuestion.author && (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              {typedQuestion.author.image && (
                <img
                  src={typedQuestion.author.image}
                  alt={typedQuestion.author.name}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-sm">{typedQuestion.author.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Autor
                </p>
              </div>
            </div>
          )}


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
                <p className="text-muted-foreground">Criada em</p>
                <p className="font-medium">
                  {typedQuestion.createdAt
                    ? format(new Date(typedQuestion.createdAt), "dd/MM/yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Atualizada em</p>
                <p className="font-medium">
                  {typedQuestion.updatedAt
                    ? format(new Date(typedQuestion.updatedAt), "dd/MM/yyyy HH:mm")
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>


          {typedQuestion.references && Array.isArray(typedQuestion.references) && typedQuestion.references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Referências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {typedQuestion.references.map((ref: any, index: number) => (
                    <div key={index} className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ref.title}</p>
                          {ref.url && (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline break-all"
                            >
                              {ref.url}
                            </a>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {ref.type === 'book' && 'Livro'}
                          {ref.type === 'article' && 'Artigo'}
                          {ref.type === 'website' && 'Website'}
                          {ref.type === 'other' && 'Outro'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-40" />
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
