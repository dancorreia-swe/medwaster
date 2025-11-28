import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Trophy } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement } from "@server/db/schema/achievements";

interface AchievementCardProps {
  achievement: Achievement;
  onEdit?: (achievement: Achievement) => void;
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

export function AchievementCard({ achievement, onEdit }: AchievementCardProps) {
  const isActive = achievement.status === "active";
  const badgeIcon = achievement.badgeIcon || "trophy";
  const badgeColor = achievement.badgeColor || "#fbbf24";

  const Icon = (LucideIcons as any)[
    badgeIcon.split("-").map((s, i) =>
      i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) :
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join("")
  ] || Trophy;

  const handleCardClick = (e: React.MouseEvent) => {
    onEdit?.(achievement);
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
