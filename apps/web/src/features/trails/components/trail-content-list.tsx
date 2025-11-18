import { useMemo } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  GripVertical,
  BookOpen,
  HelpCircle,
  FileText,
  X,
  Lock,
  LockOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { TrailContent, ContentType } from "../types";

const ITEM_TYPE = "TRAIL_CONTENT";

// Utility to strip HTML tags
const stripHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

interface TrailContentItemProps {
  content: TrailContent;
  index: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (contentId: number) => void;
  onToggleRequired: (contentId: number) => void;
}

function TrailContentItem({
  content,
  index,
  onMove,
  onRemove,
  onToggleRequired,
}: TrailContentItemProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
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

  return (
    <div
      ref={(node) => preview(drop(node))}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div
            ref={drag}
            className="cursor-move text-muted-foreground hover:text-foreground transition-colors"
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
  const sortedContent = useMemo(() => {
    return [...content].sort((a, b) => a.sequence - b.sequence);
  }, [content]);

  const handleMove = (dragIndex: number, hoverIndex: number) => {
    const newContent = [...sortedContent];
    const [removed] = newContent.splice(dragIndex, 1);
    newContent.splice(hoverIndex, 0, removed);

    // Update sequences
    const reordered = newContent.map((item, index) => ({
      ...item,
      sequence: index,
    }));

    onReorder(reordered);
  };

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
    <div className="space-y-2">
      {sortedContent.map((item, index) => (
        <TrailContentItem
          key={item.id}
          content={item}
          index={index}
          onMove={handleMove}
          onRemove={onRemove}
          onToggleRequired={onToggleRequired}
        />
      ))}
    </div>
  );
}
