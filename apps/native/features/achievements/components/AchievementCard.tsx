import { View, Text, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/icon";
import type { Achievement } from "../api";
import { getLucideIcon } from "../utils";
import { useColorScheme } from "@/lib/use-color-scheme";

interface AchievementCardProps {
  achievement: Achievement;
  locked?: boolean;
  highlighted?: boolean;
}

const categoryColors: Record<string, string> = {
  trails: "#3B82F6",
  wiki: "#10B981",
  questions: "#F59E0B",
  certification: "#8B5CF6",
  engagement: "#EC4899",
  social: "#06B6D4",
  general: "#6B7280",
};

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export function AchievementCard({
  achievement,
  locked = true,
  highlighted = false,
}: AchievementCardProps) {
  const { isDarkColorScheme } = useColorScheme();
  const badgeColor = achievement.badgeColor || "#fbbf24";
  const categoryColor =
    categoryColors[achievement.category] || categoryColors.general;
  const difficultyLabel =
    difficultyLabels[achievement.difficulty] || achievement.difficulty;

  const IconComponent = getLucideIcon(achievement.badgeIcon);

  // Animation values
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const shadowOpacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (highlighted) {
      // Animate in: border color, shadow, and scale
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(borderColorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(shadowOpacityAnim, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate out: return to normal
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(borderColorAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(shadowOpacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [highlighted]);

  // Interpolate border color
  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDarkColorScheme ? "#1F2937" : "#E5E7EB", // gray-800 (dark) or gray-200 (light)
      "#2B7FFF",
    ], // animate to blue-500
  });

  return (
    <Animated.View
      style={{
        backgroundColor: isDarkColorScheme ? '#0b1220' : 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        borderWidth: 2,
        borderColor,
        shadowColor: '#2B7FFF',
        shadowOpacity: shadowOpacityAnim,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: highlighted ? 4 : 0,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <View className="items-center">
        {/* Badge icon */}
        <View
          className="size-16 rounded-full items-center justify-center mb-4"
          style={{
            backgroundColor: locked
              ? isDarkColorScheme
                ? "#111827"
                : "#F3F4F6"
              : `${badgeColor}20`,
            opacity: locked ? 0.5 : 1,
          }}
        >
          <Icon
            icon={IconComponent}
            size={32}
            color={locked ? (isDarkColorScheme ? "#9CA3AF" : "#9CA3AF") : badgeColor}
          />
        </View>

        {/* Unlocked badge (if unlocked) */}
        {!locked && (
          <View className="absolute top-0 right-0 bg-green-500 rounded-full px-2 py-1">
            <Text className="text-xs font-bold text-white">✓ Desbloqueado</Text>
          </View>
        )}

        {/* Title */}
        <Text className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2 text-center">
          {achievement.name}
        </Text>

        {/* Description */}
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
          {achievement.description}
        </Text>

        {/* Progress bar for locked achievements */}
        {locked && achievement.progressPercentage > 0 && (
          <View className="w-full mb-4">
            <View className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${achievement.progressPercentage}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
              {Math.round(achievement.progressPercentage)}% concluído
            </Text>
          </View>
        )}

        {/* Badges row */}
        <View className="flex-row items-center justify-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 w-full">
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            <Text
              className="text-xs font-medium capitalize"
              style={{ color: categoryColor }}
            >
              {achievement.category}
            </Text>
          </View>
          <View className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            <Text className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {difficultyLabel}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
