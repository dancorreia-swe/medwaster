import { useDrag, useDrop } from "react-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  GripVertical,
  Trash2,
  Settings,
  CheckCircle,
  Circle,
  Target,
  XCircle,
  FileQuestion,
  Plus
} from "lucide-react";
import { stripHtml } from "@/lib/utils";
import { DRAG_TYPES as QUESTION_SELECTOR_DRAG_TYPES } from "./question-selector";
import { QUESTION_DIFFICULTY_LABELS } from "@/features/questions/types";
import type { QuestionListItem } from "@/features/questions/types";

interface QuizQuestion {
  id: string;
  questionId: number;
  order: number;
  points: number;
  required: boolean;
  question: QuestionListItem;
}

interface QuizQuestionBuilderProps {
  questions: QuizQuestion[];
  onRemoveQuestion: (id: string) => void;
  onReorderQuestions: (questions: QuizQuestion[]) => void;
  onUpdateQuestion: (id: string, updates: Partial<QuizQuestion>) => void;
  onAddQuestion: (questionId: number, questionData: QuestionListItem) => void;
}

const DRAG_TYPES = {
  QUIZ_QUESTION: "quiz-question",
  QUESTION_FROM_BANK: QUESTION_SELECTOR_DRAG_TYPES.QUESTION_FROM_BANK,
} as const;

interface DragItem {
  id: string;
  index: number;
}

interface QuestionFromBankDragItem {
  question: QuestionListItem;
}


const getQuestionTypeIcon = (type: string) => {
  switch (type) {
    case "multiple_choice":
      return <CheckCircle className="h-4 w-4" />;
    case "true_false":
      return <Circle className="h-4 w-4" />;
    case "fill_in_the_blank":
      return <Target className="h-4 w-4" />;
    case "matching":
      return <XCircle className="h-4 w-4" />;
    default:
      return <FileQuestion className="h-4 w-4" />;
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "basic":
      return "bg-green-100 text-green-800";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800";
    case "advanced":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getDifficultyLabel = (difficulty: string) => {
  return QUESTION_DIFFICULTY_LABELS[difficulty as keyof typeof QUESTION_DIFFICULTY_LABELS] || difficulty;
};

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

function QuestionCard({ question, index, onRemove, onUpdate, onMove }: QuestionCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPES.QUIZ_QUESTION,
    item: { id: question.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: DRAG_TYPES.QUIZ_QUESTION,
    hover: (item: DragItem) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <Card
      ref={(node) => drag(drop(node))}
      className={`transition-all ${isDragging ? "opacity-50" : "hover:shadow-md"} cursor-move`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 mt-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="font-mono text-xs">
              {question.order}
            </Badge>
          </div>
          
          <div className="flex-1 min-w-0">
            {question.question && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {getQuestionTypeIcon(question.question.type)}
                  <Badge variant="secondary" className={getDifficultyColor(question.question.difficulty)}>
                    {getDifficultyLabel(question.question.difficulty)}
                  </Badge>
                </div>

                <p className="text-sm font-medium line-clamp-2 mb-2">
                  {stripHtml(question.question.prompt)}
                </p>

                {question.question.category && (
                  <Badge variant="outline" className="text-xs mb-2">
                    {question.question.category.name}
                  </Badge>
                )}

                {question.question.tags && question.question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {question.question.tags.slice(0, 2).map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline" 
                    className="text-xs h-4 px-1"
                    style={{ color: tag.color || undefined }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {question.question.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs h-4 px-1">
                    +{question.question.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
              </>
            )}
            {!question.question && (
              <p className="text-sm text-muted-foreground">
                Questão ID: {question.questionId}
              </p>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <Switch
            id={`required-${question.id}`}
            checked={question.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          <Label htmlFor={`required-${question.id}`} className="text-xs">
            Obrigatória
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuizQuestionBuilder({
  questions,
  onRemoveQuestion,
  onReorderQuestions,
  onUpdateQuestion,
  onAddQuestion,
}: QuizQuestionBuilderProps) {
  const moveQuestion = (dragIndex: number, hoverIndex: number) => {
    const draggedQuestion = questions[dragIndex];
    const newQuestions = [...questions];
    newQuestions.splice(dragIndex, 1);
    newQuestions.splice(hoverIndex, 0, draggedQuestion);
    onReorderQuestions(newQuestions);
  };

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DRAG_TYPES.QUESTION_FROM_BANK,
    drop: (item: QuestionFromBankDragItem) => {
      onAddQuestion(item.question.id, item.question);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const requiredQuestions = questions.filter(q => q.required).length;

  return (
    <Card 
      ref={drop}
      className={`h-full flex flex-col transition-all ${
        isOver && canDrop ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Construtor do Quiz
          <Badge variant="secondary" className="ml-auto">
            {questions.length} pergunta{questions.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        
        {questions.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total: {totalPoints} pontos</span>
            <span>•</span>
            <span>Obrigatórias: {requiredQuestions}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4">
        {questions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-center py-12 transition-all ${
              isOver && canDrop ? 'scale-105' : ''
            }`}>
              <Plus className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                isOver && canDrop 
                  ? 'text-primary' 
                  : 'text-muted-foreground/50'
              }`} />
              <h3 className="text-lg font-medium mb-2">
                {isOver && canDrop ? 'Solte aqui para adicionar' : 'Nenhuma pergunta adicionada'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isOver && canDrop 
                  ? 'Solte a pergunta para adicioná-la ao quiz'
                  : 'Arraste perguntas do banco de dados no painel à esquerda para adicioná-las ao seu quiz.'
                }
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  onRemove={() => onRemoveQuestion(question.id)}
                  onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
                  onMove={moveQuestion}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {questions.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de Perguntas:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pontuação Máxima:</span>
                <span className="font-medium">{totalPoints} pontos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Perguntas Obrigatórias:</span>
                <span className="font-medium">{requiredQuestions}</span>
              </div>
              {requiredQuestions < questions.length && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Perguntas Opcionais:</span>
                  <span className="font-medium">{questions.length - requiredQuestions}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}