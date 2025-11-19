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

interface TrailCardProps {
  trail: Trail;
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

export function TrailCard({
  trail,
  onEdit,
  onArchive,
  onDelete,
  onPublish,
}: TrailCardProps) {
  const navigate = useNavigate();
  const difficulty = difficultyConfig[trail.difficulty];
  const status = statusConfig[trail.status];

  const handleCardClick = () => {
    navigate({
      to: "/trails/$trailId",
      params: { trailId: trail.id.toString() },
    });
  };

  const contentCount = trail.content?.length || 0;
  const prerequisiteCount = trail.prerequisites?.length || 0;

  return (
    <Card
      className="group hover:shadow-md transition-shadow cursor-pointer gap-1"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
          <CardTitle className="text-base font-medium leading-tight line-clamp-2">
            {trail.name}
          </CardTitle>
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 text-xs"
          >
            <Hash className="h-3 w-3 text-muted-foreground" />
            {trail.unlockOrder ? trail.unlockOrder + 1 : "?"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {trail.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {trail.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{contentCount} conteúdos</span>
            </div>

            {trail.estimatedTimeMinutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{trail.estimatedTimeMinutes}min</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{trail.enrolledCount} inscritos</span>
            </div>

            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>{trail.passPercentage}% aprovação</span>
            </div>
          </div>

          {prerequisiteCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>{prerequisiteCount} pré-requisito(s)</span>
            </div>
          )}
        </div>

        {trail.category && (
          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              {trail.category.name}
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {trail.author && <span>Por {trail.author.name}</span>}
          <span>{new Date(trail.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem asChild>
              <Link
                to="/trails/$trailId"
                params={{ trailId: trail.id.toString() }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(trail)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {trail.status === "draft" && onPublish && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onPublish(trail)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Publicar
                </DropdownMenuItem>
              </>
            )}
            {trail.status !== "archived" && onArchive && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onArchive(trail)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={() => onDelete?.(trail)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
