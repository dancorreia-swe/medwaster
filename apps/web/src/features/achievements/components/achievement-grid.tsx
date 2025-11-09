import type { Achievement } from "@server/db/schema/achievements";
import { AchievementCard } from "./achievement-card";

interface AchievementGridProps {
  achievements: Achievement[];
  onEdit?: (achievement: Achievement) => void;
  onUpdateOrder?: (achievementId: number, newOrder: number | null) => void;
}

export function AchievementGrid({ achievements, onEdit, onUpdateOrder }: AchievementGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          onEdit={onEdit}
          onUpdateOrder={onUpdateOrder}
        />
      ))}
    </div>
  );
}
