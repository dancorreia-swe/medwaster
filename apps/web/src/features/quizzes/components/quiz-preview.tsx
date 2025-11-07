import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Clock, Target, Users, Eye } from "lucide-react";
import { stripHtml } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  questionId: number;
  order: number;
  points: number;
  required: boolean;
  question: {
    id: number;
    prompt: string;
    type: string;
    difficulty: string;
    options?: Array<{
      id: number;
      label: string;
      content: string;
      isCorrect: boolean;
    }>;
  };
}

interface QuizFormData {
  title: string;
  description: string;
  instructions: string;
  difficulty: "basic" | "intermediate" | "advanced" | "mixed";
  status: "draft" | "active" | "inactive" | "archived";
  categoryId?: number;
  timeLimit?: number;
  maxAttempts: number;
  showResults: boolean;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  passingScore: number;
  imageUrl?: string;
}

interface QuizPreviewProps {
  formData: QuizFormData;
  questions: QuizQuestion[];
  onClose: () => void;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "basic":
      return "bg-green-100 text-green-800";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800";
    case "advanced":
      return "bg-red-100 text-red-800";
    case "mixed":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case "basic":
      return "Básico";
    case "intermediate":
      return "Intermediário";
    case "advanced":
      return "Avançado";
    case "mixed":
      return "Misto";
    default:
      return difficulty;
  }
};

export function QuizPreview({ formData, questions, onClose }: QuizPreviewProps) {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
                <X className="h-4 w-4" />
                Fechar Visualização
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Modo Visualização</span>
              </div>
            </div>
            
            <Badge variant="outline" className="gap-1">
              <Badge variant="secondary" className={getDifficultyColor(formData.difficulty)}>
                {getDifficultyLabel(formData.difficulty)}
              </Badge>
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Quiz Header */}
          <Card>
            <CardHeader>
              <div className="space-y-4">
                {formData.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <img
                      src={formData.imageUrl}
                      alt={formData.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                
                <div>
                  <CardTitle className="text-2xl mb-2">{formData.title}</CardTitle>
                  {formData.description && (
                    <p className="text-muted-foreground">{formData.description}</p>
                  )}
                </div>

                {formData.instructions && (
                  <div>
                    <h3 className="font-semibold mb-2">Instruções</h3>
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      {formData.instructions}
                    </p>
                  </div>
                )}

                {/* Quiz Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{questions.length}</div>
                      <div className="text-muted-foreground">Perguntas</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{totalPoints}</div>
                      <div className="text-muted-foreground">Pontos</div>
                    </div>
                  </div>
                  
                  {formData.timeLimit && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{formData.timeLimit}</div>
                        <div className="text-muted-foreground">Minutos</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formData.maxAttempts}</div>
                      <div className="text-muted-foreground">Tentativas</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
                  <span>Nota mínima: {formData.passingScore}%</span>
                  {formData.showResults && <span>• Mostra resultados</span>}
                  {formData.showCorrectAnswers && <span>• Mostra respostas corretas</span>}
                  {formData.randomizeQuestions && <span>• Perguntas aleatórias</span>}
                  {formData.randomizeOptions && <span>• Opções aleatórias</span>}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Questions Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perguntas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id}>
                      <div className="flex items-start gap-3 mb-3">
                        <Badge variant="outline" className="mt-1">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className={getDifficultyColor(question.question.difficulty)}>
                              {getDifficultyLabel(question.question.difficulty)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {question.points} {question.points === 1 ? 'ponto' : 'pontos'}
                            </Badge>
                            {question.required && (
                              <Badge variant="outline" className="text-xs">
                                Obrigatória
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-medium mb-3">{stripHtml(question.question.prompt)}</h3>

                          {question.question.options && question.question.options.length > 0 && (
                            <div className="space-y-2">
                              {question.question.options.map((option) => (
                                <div
                                  key={option.id}
                                  className={`p-3 rounded-lg border transition-colors ${
                                    option.isCorrect
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-muted/50 border-muted'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">{option.label})</span>
                                    <span>{option.content}</span>
                                    {option.isCorrect && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800 ml-auto">
                                        Correto
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {index < questions.length - 1 && <Separator className="my-6" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}