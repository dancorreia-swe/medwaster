import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Plus,
} from "lucide-react";
import { stripHtml } from "@/lib/utils";
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
  return (
    QUESTION_DIFFICULTY_LABELS[
      difficulty as keyof typeof QUESTION_DIFFICULTY_LABELS
    ] || difficulty
  );
};

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  isDragOverlay?: boolean;
}

function QuestionCard({
  question,
  index,
  onRemove,
  onUpdate,
  isDragOverlay = false,
}: QuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging && { willChange: 'transform' }),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={isDragging ? 'opacity-0' : ''}
    >
      <Card
        className={`transition-all ${isDragOverlay ? 'shadow-2xl ring-2 ring-primary cursor-grabbing' : 'hover:shadow-md'}`}
      >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 mt-1">
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {question.order}
            </Badge>
          </div>

          <div className="flex-1 min-w-0">
            {question.question && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {getQuestionTypeIcon(question.question.type)}
                  <Badge
                    variant="secondary"
                    className={getDifficultyColor(question.question.difficulty)}
                  >
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

                {question.question.tags &&
                  question.question.tags.length > 0 && (
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
    </div>
  );
}

export function QuizQuestionBuilder({
  questions,
  onRemoveQuestion,
  onReorderQuestions,
  onUpdateQuestion,
  onAddQuestion,
}: QuizQuestionBuilderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((item) => item.id === active.id);
      const newIndex = questions.findIndex((item) => item.id === over.id);

      const reordered = arrayMove(questions, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          order: index + 1,
        })
      );

      onReorderQuestions(reordered);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId
    ? questions.find((item) => item.id === activeId)
    : null;

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const requiredQuestions = questions.filter((q) => q.required).length;

  return (
    <Card className="h-full flex flex-col transition-all gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Construtor do Quiz
          <Badge variant="secondary" className="ml-auto">
            {questions.length} pergunta{questions.length !== 1 ? "s" : ""}
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
            <div className="text-center py-12">
              <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">
                Nenhuma pergunta adicionada
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Arraste perguntas do banco de dados no painel à esquerda para adicioná-las ao seu quiz.
              </p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-2">
                  {questions.map((question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      index={index}
                      onRemove={() => onRemoveQuestion(question.id)}
                      onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </SortableContext>
            <DragOverlay
              dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activeItem ? (
                <div style={{ cursor: 'grabbing' }}>
                  <QuestionCard
                    question={activeItem}
                    index={questions.findIndex((q) => q.id === activeItem.id)}
                    onRemove={() => {}}
                    onUpdate={() => {}}
                    isDragOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {questions.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Total de Perguntas:
                </span>
                <span className="font-medium">{questions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pontuação Máxima:</span>
                <span className="font-medium">{totalPoints} pontos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Perguntas Obrigatórias:
                </span>
                <span className="font-medium">{requiredQuestions}</span>
              </div>
              {requiredQuestions < questions.length && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Perguntas Opcionais:
                  </span>
                  <span className="font-medium">
                    {questions.length - requiredQuestions}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

