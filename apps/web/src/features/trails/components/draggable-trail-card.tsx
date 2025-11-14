import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Users,
  Trophy,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  Eye,
  BookOpen,
  Lock,
  CheckCircle2,
  Hash,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Trail } from "../types";

interface DraggableTrailCardProps {
  trail: Trail;
  index: number;
  isOrderMode: boolean;
  onEdit?: (trail: Trail) => void;
  onArchive?: (trail: Trail) => void;
  onDelete?: (trail: Trail) => void;
  onPublish?: (trail: Trail) => void;
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

export function DraggableTrailCard({
  trail,
  index,
  isOrderMode,
  onEdit,
  onArchive,
  onDelete,
  onPublish,
}: DraggableTrailCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trail.id, disabled: !isOrderMode });

  const navigate = useNavigate();
  const difficulty = difficultyConfig[trail.difficulty];
  const status = statusConfig[trail.status];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isOrderMode) {
      e.preventDefault();
      return;
    }
    navigate({
      to: "/trails/$trailId",
      params: { trailId: trail.id.toString() },
    });
  };

  const contentCount = trail.content?.length || 0;
  const prerequisiteCount = trail.prerequisites?.length || 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`group transition-all ${
          isOrderMode
            ? "cursor-grab active:cursor-grabbing hover:shadow-lg"
            : "cursor-pointer hover:shadow-md"
        } ${isDragging ? "shadow-2xl ring-2 ring-primary" : ""}`}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isOrderMode && (
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-5 w-5" />
                </div>
              )}
              <CardTitle className="text-base font-medium leading-tight line-clamp-2 flex-1">
                {trail.name}
              </CardTitle>
            </div>
            <Badge
              variant={isOrderMode ? "default" : "outline"}
              className={`inline-flex items-center gap-1 text-xs shrink-0 ${
                isOrderMode ? "bg-primary text-primary-foreground font-semibold" : ""
              }`}
            >
              <Hash className="h-3 w-3" />
              {index + 1}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {trail.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {trail.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
            {trail.category && (
              <Badge variant="outline">{trail.category.name}</Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{contentCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              <span>{prerequisiteCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>0</span>
            </div>
          </div>
        </CardContent>

        {!isOrderMode && (
          <CardFooter className="pt-0 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate({
                  to: "/trails/$trailId",
                  params: { trailId: trail.id.toString() },
                });
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(trail);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {trail.status === "draft" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublish?.(trail);
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Publicar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive?.(trail);
                  }}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(trail);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
