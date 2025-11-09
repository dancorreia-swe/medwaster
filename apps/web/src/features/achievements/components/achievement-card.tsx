import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, GripVertical, Trophy, Hash, Check, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Achievement } from "@server/db/schema/achievements";

interface AchievementCardProps {
  achievement: Achievement;
  onEdit?: (achievement: Achievement) => void;
  onUpdateOrder?: (achievementId: number, newOrder: number | null) => void;
}

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
} as const;

const difficultyLabels = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
} as const;

export function AchievementCard({ achievement, onEdit, onUpdateOrder }: AchievementCardProps) {
  const isActive = achievement.status === "active";
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [orderValue, setOrderValue] = useState(achievement.displayOrder?.toString() || "0");

  const badgeIcon = achievement.badgeIcon || "trophy";
  const badgeColor = achievement.badgeColor || "#fbbf24";

  const Icon = (LucideIcons as any)[
    badgeIcon.split("-").map((s, i) =>
      i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) :
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join("")
  ] || Trophy;

  // Sync local state when achievement prop changes
  useEffect(() => {
    setOrderValue(achievement.displayOrder?.toString() || "0");
  }, [achievement.displayOrder]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on order input
    if ((e.target as HTMLElement).closest('.order-input-container')) {
      return;
    }
    onEdit?.(achievement);
  };

  const handleSaveOrder = () => {
    if (!onUpdateOrder) return;

    const newOrder = orderValue.trim() === "" ? 0 : parseInt(orderValue);

    if (isNaN(newOrder) || newOrder < 0) {
      toast.error("Ordem deve ser um número positivo");
      return;
    }

    onUpdateOrder(achievement.id, newOrder);
    setIsEditingOrder(false);
  };

  const handleCancelOrder = () => {
    setOrderValue(achievement.displayOrder?.toString() || "0");
    setIsEditingOrder(false);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-md cursor-pointer flex flex-col",
        !isActive && "opacity-60",
      )}
      onClick={handleCardClick}
    >
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {achievement.isSecret && (
          <Badge variant="outline" className="text-xs gap-1">
            <EyeOff className="h-3 w-3" />
            Secreto
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3 flex-1 flex flex-col items-center text-center space-y-4 pt-8">
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-full"
          style={{ 
            backgroundColor: isActive ? badgeColor + "20" : "#00000010"
          }}
        >
          {achievement.badgeImageUrl ? (
            <img
              src={achievement.badgeImageUrl}
              alt={achievement.name}
              className="h-10 w-10 object-contain"
            />
          ) : achievement.badgeSvg ? (
            <div
              dangerouslySetInnerHTML={{ __html: achievement.badgeSvg }}
              className="h-10 w-10"
            />
          ) : (
            <Icon className="size-10" style={{ color: isActive ? badgeColor : "#666" }} />
          )}
        </div>
        <div className="flex-1 w-full space-y-2">
          <CardTitle className="text-lg line-clamp-1">
            {achievement.name}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {achievement.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {statusLabels[achievement.status]}
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm pt-3 border-t">
            <Badge variant="outline" className="text-xs">
              {difficultyLabels[achievement.difficulty]}
            </Badge>
            <div className="order-input-container" onClick={(e) => e.stopPropagation()}>
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
                <div
                  className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => setIsEditingOrder(true)}
                >
                  <GripVertical className="h-4 w-4" />
                  <span>#{achievement.displayOrder || 0}</span>
                </div>
              )}
            </div>
            {achievement.isSecret ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
