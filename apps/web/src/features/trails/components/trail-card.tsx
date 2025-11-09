import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
  Check,
  X,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Trail } from "../types";

interface TrailCardProps {
  trail: Trail;
  onEdit?: (trail: Trail) => void;
  onArchive?: (trail: Trail) => void;
  onDelete?: (trail: Trail) => void;
  onPublish?: (trail: Trail) => void;
  onUpdateOrder?: (trailId: number, newOrder: number | null) => void;
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
  onUpdateOrder,
}: TrailCardProps) {
  const navigate = useNavigate();
  const difficulty = difficultyConfig[trail.difficulty];
  const status = statusConfig[trail.status];

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [orderValue, setOrderValue] = useState(trail.unlockOrder?.toString() || "");

  // Sync local state when trail prop changes
  useEffect(() => {
    setOrderValue(trail.unlockOrder?.toString() || "");
  }, [trail.unlockOrder]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on order input
    if ((e.target as HTMLElement).closest('.order-input-container')) {
      return;
    }
    navigate({ to: "/trails/$trailId", params: { trailId: trail.id.toString() } });
  };

  const handleSaveOrder = () => {
    if (!onUpdateOrder) return;

    const newOrder = orderValue.trim() === "" ? null : parseInt(orderValue);

    if (newOrder !== null && (isNaN(newOrder) || newOrder < 0)) {
      toast.error("Ordem deve ser um número positivo");
      return;
    }

    onUpdateOrder(trail.id, newOrder);
    setIsEditingOrder(false);
  };

  const handleCancelOrder = () => {
    setOrderValue(trail.unlockOrder?.toString() || "");
    setIsEditingOrder(false);
  };

  const contentCount = trail.content?.length || 0;
  const prerequisiteCount = trail.prerequisites?.length || 0;

  return (
    <Card
      className="group hover:shadow-md transition-shadow cursor-pointer gap-1"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <CardTitle className="text-base font-medium leading-tight line-clamp-2">
              {trail.name}
            </CardTitle>
            <div className="order-input-container shrink-0" onClick={(e) => e.stopPropagation()}>
              {isEditingOrder ? (
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    value={orderValue}
                    onChange={(e) => setOrderValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveOrder();
                      if (e.key === "Escape") handleCancelOrder();
                    }}
                    className="h-6 w-16 px-2 text-xs"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={handleSaveOrder}
                  >
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={handleCancelOrder}
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-accent"
                  onClick={() => setIsEditingOrder(true)}
                >
                  #{trail.unlockOrder ?? "?"}
                </Badge>
              )}
            </div>
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
                <Link to="/trails/$trailId" params={{ trailId: trail.id.toString() }}>
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
          <div className="pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              {trail.category.name}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {trail.author && <span>Por {trail.author.name}</span>}
            <span>{new Date(trail.createdAt).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
