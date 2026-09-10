import { useState } from "react";
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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { NumberInput } from "@/components/ui/number-input";
import {
  GripVertical,
  Trash2,
  ListChecks,
  ToggleLeft,
  TextCursorInput,
  ArrowLeftRight,
  FileQuestion,
} from "lucide-react";
import { stripHtml, cn } from "@/lib/utils";
import type { QuestionListItem } from "@/features/questions/types";
import { quizDifficultyOption } from "../types";

export interface QuizQuestion {
  id: string;
  questionId: number;
  order: number;
  points: number;
  required: boolean;
  question: QuestionListItem;
}

interface QuizQuestionListProps {
  questions: QuizQuestion[];
  onRemoveQuestion: (id: string) => void;
  onReorderQuestions: (questions: QuizQuestion[]) => void;
  onUpdateQuestion: (id: string, updates: Partial<QuizQuestion>) => void;
  onBrowseQuestions: () => void;
  isBankOpen: boolean;
}

const getQuestionTypeIcon = (type: string) => {
  switch (type) {
    case "multiple_choice":
      return <ListChecks className="h-3.5 w-3.5" />;
    case "true_false":
      return <ToggleLeft className="h-3.5 w-3.5" />;
    case "fill_in_the_blank":
      return <TextCursorInput className="h-3.5 w-3.5" />;
    case "matching":
      return <ArrowLeftRight className="h-3.5 w-3.5" />;
    default:
      return <FileQuestion className="h-3.5 w-3.5" />;
  }
};

interface QuestionRowProps {
  question: QuizQuestion;
  onRemove: () => void;
  onUpdate: (updates: Partial<QuizQuestion>) => void;
  isDragOverlay?: boolean;
}

/**
 * A row, not a card. The questions are one ordered sequence, so hairlines and a
 * numbered gutter read as a single list; boxing each one reads as N objects.
 */
function QuestionRow({
  question,
  onRemove,
  onUpdate,
  isDragOverlay = false,
}: QuestionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: isDragOverlay });

  const difficulty = quizDifficultyOption(question.question?.difficulty ?? "");

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isDragging && { willChange: "transform" }),
      }}
      className={cn(
        "group relative bg-background",
        isDragging && "opacity-0",
        isDragOverlay && "rounded-lg border shadow-lg",
      )}
    >
      <div className="flex gap-3 py-4">
        <div className="flex w-10 shrink-0 flex-col items-center gap-1 pt-0.5">
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {question.order}
          </span>
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reordenar pergunta ${question.order}`}
            className="cursor-grab touch-none text-muted-foreground/30 transition-colors hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          {question.question ? (
            <>
              <p className="text-sm leading-snug">
                {stripHtml(question.question.prompt)}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-muted-foreground">
                <span aria-hidden>
                  {getQuestionTypeIcon(question.question.type)}
                </span>
                {difficulty && (
                  <Badge variant="secondary" className={difficulty.badgeClass}>
                    {difficulty.label}
                  </Badge>
                )}
                {question.question.category && (
                  <Badge variant="outline" className="font-normal">
                    {question.question.category.name}
                  </Badge>
                )}
                {question.question.tags?.slice(0, 2).map(({ tag }) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="font-normal"
                    style={{ color: tag.color || undefined }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {(question.question.tags?.length ?? 0) > 2 && (
                  <Badge variant="outline" className="font-normal">
                    +{(question.question.tags?.length ?? 0) - 2}
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Questão ID: {question.questionId}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-start gap-4 pt-0.5">
          <div className="flex items-center gap-2">
            <Label
              htmlFor={`points-${question.id}`}
              className="text-xs text-muted-foreground"
            >
              Pontos
            </Label>
            <div className="w-24">
              <NumberInput
                id={`points-${question.id}`}
                value={question.points}
                onValueChange={(value) => onUpdate({ points: value ?? 1 })}
                min={1}
                max={100}
                stepper={1}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id={`required-${question.id}`}
              checked={question.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
            <Label
              htmlFor={`required-${question.id}`}
              className="text-xs text-muted-foreground"
            >
              Obrigatória
            </Label>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Remover pergunta ${question.order}`}
            className="h-8 w-8 p-0 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function QuizQuestionList({
  questions,
  onRemoveQuestion,
  onReorderQuestions,
  onUpdateQuestion,
  onBrowseQuestions,
  isBankOpen,
}: QuizQuestionListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10, delay: 100, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((item) => item.id === active.id);
      const newIndex = questions.findIndex((item) => item.id === over.id);

      onReorderQuestions(
        arrayMove(questions, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index + 1,
        })),
      );
    }
  };

  const activeItem = activeId
    ? questions.find((item) => item.id === activeId)
    : null;

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-medium">Este quiz ainda não tem perguntas</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {isBankOpen
            ? "Clique numa pergunta do banco à esquerda para montar a sequência que o aluno vai responder."
            : "Escolha perguntas do banco para montar a sequência que o aluno vai responder."}
        </p>
        {!isBankOpen && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onBrowseQuestions}
          >
            Abrir banco de perguntas
          </Button>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event: DragStartEvent) =>
        setActiveId(event.active.id as string)
      }
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="divide-y divide-border border-y">
          {questions.map((question) => (
            <QuestionRow
              key={question.id}
              question={question}
              onRemove={() => onRemoveQuestion(question.id)}
              onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeItem ? (
          <QuestionRow
            question={activeItem}
            onRemove={() => {}}
            onUpdate={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
