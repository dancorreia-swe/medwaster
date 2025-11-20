import { View, Text, ScrollView } from "react-native";
import { useEffect, useRef, useState } from "react";
import type { Achievement } from "../api";
import { AchievementCard } from "./AchievementCard";

interface AchievementsListProps {
  achievements: Achievement[];
  highlightAchievementId?: number;
}

const categoryLabels: Record<string, string> = {
  trails: "Trilhas",
  wiki: "Wiki",
  questions: "Questões",
  certification: "Certificação",
  engagement: "Engajamento",
  social: "Social",
  general: "Geral",
};

export function AchievementsList({ achievements, highlightAchievementId }: AchievementsListProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<number | undefined>(highlightAchievementId);

  // Debug: Check if achievements have unlock status
  console.log('📋 Achievements received:', achievements.length);
  console.log('🔓 Unlocked count:', achievements.filter(a => a.isUnlocked).length);

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  // Sort categories and achievements within each category
  const sortedCategories = Object.keys(groupedAchievements).sort();

  // Scroll to highlighted achievement and clear highlight after 3 seconds
  useEffect(() => {
    if (highlightAchievementId) {
      // Set active highlight
      setActiveHighlightId(highlightAchievementId);

      // Find the achievement to get its category
      const targetAchievement = achievements.find(a => a.id === highlightAchievementId);

      if (targetAchievement) {
        // Calculate position more accurately
        let estimatedY = 0;

        // Account for padding at the top
        estimatedY += 16; // py-4 = 16px

        // Go through each category in order
        for (const category of sortedCategories) {
          const categoryAchievements = groupedAchievements[category].sort(
            (a, b) => a.displayOrder - b.displayOrder
          );

          // If this is the target category
          if (category === targetAchievement.category) {
            // Add category header height
            estimatedY += 60; // Category header ~60px (text + margin)

            // Find the achievement index within this category
            const indexInCategory = categoryAchievements.findIndex(
              a => a.id === highlightAchievementId
            );

            // Add height for all achievements before this one in the category
            estimatedY += indexInCategory * 180; // Each card ~180px
            break;
          } else {
            // Add this entire category's height
            estimatedY += 60; // Category header
            estimatedY += categoryAchievements.length * 180; // All cards in this category
            estimatedY += 32; // mb-8 = 32px bottom margin
          }
        }

        // Small delay to ensure layout is complete
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, estimatedY - 80), // Offset from top for better visibility
            animated: true,
          });
        }, 300);
      }

      // Clear highlight after 3 seconds
      const highlightTimeout = setTimeout(() => {
        setActiveHighlightId(undefined);
      }, 3000);

      return () => clearTimeout(highlightTimeout);
    }
  }, [highlightAchievementId, achievements]);

  return (
    <ScrollView ref={scrollViewRef} className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="px-5 py-4">
        {sortedCategories.map((category) => (
          <View key={category} className="mb-8">
            {/* Category header */}
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">
              {categoryLabels[category] || category}
            </Text>

            {/* Achievements in this category */}
            {groupedAchievements[category]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  locked={!achievement.isUnlocked}
                  highlighted={activeHighlightId === achievement.id}
                />
              ))}
          </View>
        ))}

        {achievements.length === 0 && (
          <View className="items-center justify-center py-16">
            <Text className="text-6xl mb-4">🏆</Text>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2">
              Nenhuma conquista disponível
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center px-8">
              As conquistas aparecerão aqui quando estiverem disponíveis.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
