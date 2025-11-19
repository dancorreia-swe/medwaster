import { useMemo } from "react";
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
import {
  GripVertical,
  BookOpen,
  HelpCircle,
  FileText,
  X,
  Lock,
  LockOpen,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { TrailContent, ContentType } from "../types";

// Utility to strip HTML tags
const stripHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

interface TrailContentItemProps {
  content: TrailContent;
  onRemove: (contentId: number) => void;
  onToggleRequired: (contentId: number) => void;
  isDragOverlay?: boolean;
}

function TrailContentItem({
  content,
  onRemove,
  onToggleRequired,
  isDragOverlay = false,
}: TrailContentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: content.id.toString(),
    disabled: isDragOverlay,
  });

  const getContentDetails = () => {
    if (content.question) {
      return {
        icon: <HelpCircle className="h-4 w-4" />,
        title: stripHtml(content.question.prompt),
        type: "Questão",
        difficulty: content.question.difficulty,
      };
    }
    if (content.quiz) {
      return {
        icon: <BookOpen className="h-4 w-4" />,
        title: stripHtml(content.quiz.title),
        type: "Quiz",
        difficulty: content.quiz.difficulty,
      };
    }
    if (content.article) {
      return {
        icon: <FileText className="h-4 w-4" />,
        title: stripHtml(content.article.title),
        type: "Artigo",
        difficulty: undefined,
      };
    }
    return null;
  };

  const details = getContentDetails();

  if (!details) return null;

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
      <Card className={`p-4 ${isDragOverlay ? 'shadow-2xl ring-2 ring-primary cursor-grabbing' : ''}`}>
        <div className="flex items-center gap-3">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {details.icon}
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-2 text-sm">
                    {details.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {details.type}
                    </Badge>
                    {details.difficulty && (
                      <Badge
                        variant={
                          details.difficulty === "basic"
                            ? "secondary"
                            : details.difficulty === "intermediate"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {details.difficulty === "basic"
                          ? "Básico"
                          : details.difficulty === "intermediate"
                          ? "Intermediário"
                          : "Avançado"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {content.isRequired ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <LockOpen className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label
                    htmlFor={`required-${content.id}`}
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    {content.isRequired ? "Obrigatório" : "Opcional"}
                  </Label>
                  <Switch
                    id={`required-${content.id}`}
                    checked={content.isRequired}
                    onCheckedChange={() => onToggleRequired(content.id)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(content.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface TrailContentListProps {
  content: TrailContent[];
  onReorder: (reorderedContent: TrailContent[]) => void;
  onRemove: (contentId: number) => void;
  onToggleRequired: (contentId: number) => void;
}

export function TrailContentList({
  content,
  onReorder,
  onRemove,
  onToggleRequired,
}: TrailContentListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sortedContent = useMemo(() => {
    return [...content].sort((a, b) => a.sequence - b.sequence);
  }, [content]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // 10px movement required before drag starts (reduces accidental drags)
        delay: 100,  // 100ms delay helps reduce twitchiness
        tolerance: 5, // 5px tolerance
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
      const oldIndex = sortedContent.findIndex(
        (item) => item.id.toString() === active.id
      );
      const newIndex = sortedContent.findIndex(
        (item) => item.id.toString() === over.id
      );

      const reordered = arrayMove(sortedContent, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          sequence: index,
        })
      );

      onReorder(reordered);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId
    ? sortedContent.find((item) => item.id.toString() === activeId)
    : null;

  if (sortedContent.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Nenhum conteúdo adicionado</p>
          <p className="text-sm mt-1">
            Adicione questões, quizzes ou artigos para criar sua trilha
          </p>
        </div>
      </Card>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={sortedContent.map((item) => item.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {sortedContent.map((item) => (
            <TrailContentItem
              key={item.id}
              content={item}
              onRemove={onRemove}
              onToggleRequired={onToggleRequired}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay 
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeItem ? (
          <div style={{ cursor: 'grabbing' }}>
            <TrailContentItem
              content={activeItem}
              onRemove={onRemove}
              onToggleRequired={onToggleRequired}
              isDragOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
