import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MoreHorizontal } from "lucide-react-native";
import { Icon } from "@/components/icon";
import { useAchievements, getLucideIcon } from "@/features/achievements";
import type { Achievement } from "@/features/achievements/api";
import { useRouter } from "expo-router";

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
}

function AchievementBadge({
  achievement,
  onPress,
}: AchievementBadgeProps) {
  const IconComponent = getLucideIcon(achievement.badgeIcon);
  const badgeColor = achievement.badgeColor || "#fbbf24";
  const isUnlocked = achievement.isUnlocked;

  const addOpacityToColor = (color: string, opacity: number) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <TouchableOpacity
      className="items-center gap-2"
      onPress={onPress}
      style={{ width: 70 }}
    >
      {isUnlocked ? (
        <View
          className="rounded-full items-center justify-center border-2"
          style={{
            width: 70,
            height: 70,
            backgroundColor: addOpacityToColor(badgeColor, 0.15),
            borderColor: addOpacityToColor(badgeColor, 0.3),
          }}
        >
          <Icon
            icon={IconComponent}
            size={32}
            color={badgeColor}
          />
        </View>
      ) : (
        <View
          className="rounded-full items-center justify-center border-2 border-gray-200"
          style={{
            width: 70,
            height: 70,
            backgroundColor: "#F3F4F6",
            opacity: 0.4,
          }}
        >
          <Icon
            icon={IconComponent}
            size={32}
            color="#9CA3AF"
          />
        </View>
      )}
      <Text
        className="text-sm text-gray-600 dark:text-gray-300 text-center"
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {achievement.name}
      </Text>
    </TouchableOpacity>
  );
}

interface AchievementsSectionProps {
  onViewAll: () => void;
}

export function AchievementsSection({ onViewAll }: AchievementsSectionProps) {
  const { data: achievements, isLoading } = useAchievements();
  const router = useRouter();

  // Get first 3 achievements: prioritize unlocked, then by display order
  const displayAchievements = achievements
    ?.sort((a, b) => {
      // Unlocked first
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      // Then by most recent unlock
      if (a.isUnlocked && b.isUnlocked && a.unlockedAt && b.unlockedAt) {
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      }
      // Finally by display order
      return a.displayOrder - b.displayOrder;
    })
    .slice(0, 3);

  const handleAchievementPress = (achievementId: number) => {
    router.push({
      pathname: "/(app)/(tabs)/(profile)/achievements",
      params: { achievementId: achievementId.toString() },
    });
  };

  return (
    <View className="bg-white dark:bg-gray-900 px-5 py-5 border-t border-b border-gray-100 dark:border-gray-800">
      <Text className="text-base font-bold text-gray-900 dark:text-gray-50 mb-4">
        Minhas conquistas
      </Text>

      {isLoading ? (
        <View className="h-24 items-center justify-center">
          <ActivityIndicator size="small" color="#2B7FFF" />
        </View>
      ) : (
        <View className="flex-row items-center justify-between gap-4">
          {displayAchievements?.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              onPress={() => handleAchievementPress(achievement.id)}
            />
          ))}

          {/* Fill with empty slots if less than 3 achievements */}
          {Array.from({ length: Math.max(0, 3 - (displayAchievements?.length || 0)) }).map((_, i) => (
            <View key={`empty-${i}`} style={{ width: 70 }} />
          ))}

          <TouchableOpacity
            className="items-center gap-[7px]"
            onPress={onViewAll}
            style={{ width: 70 }}
          >
            <View
              className="rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
              style={{ width: 70, height: 70 }}
            >
              <Icon icon={MoreHorizontal} size={28} className="text-gray-600 dark:text-gray-300" />
            </View>
            <Text
              className="text-sm text-gray-600 dark:text-gray-300 text-center"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              Ver todas
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
