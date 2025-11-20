import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { Container } from "@/components/container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAchievements, AchievementsList } from "@/features/achievements";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievementId } = useLocalSearchParams<{ achievementId?: string }>();
  const { data: achievements, isLoading, error } = useAchievements();
  const { isDarkColorScheme } = useColorScheme();
  const chevronColor = isDarkColorScheme ? "#E5E7EB" : "#364153";

  const highlightAchievementId = achievementId ? parseInt(achievementId, 10) : undefined;

  return (
    <Container className="flex-1 bg-white dark:bg-gray-950">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-white dark:bg-gray-900 flex-row items-center border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 items-center justify-center"
        >
          <ChevronLeft size={24} color={chevronColor} strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-gray-50 ml-3">Conquistas</Text>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2B7FFF" />
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            Carregando conquistas...
          </Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View className="px-5 py-3.5">
          <View className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4">
            <Text className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
              Erro ao carregar conquistas
            </Text>
            <Text className="text-xs text-red-700 dark:text-red-200">
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </Text>
          </View>
        </View>
      )}

      {/* Achievements list */}
      {!isLoading && !error && achievements && (
        <AchievementsList
          achievements={achievements}
          highlightAchievementId={highlightAchievementId}
        />
      )}
    </Container>
  );
}
