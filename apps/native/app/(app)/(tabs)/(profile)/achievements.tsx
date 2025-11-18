import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { Container } from "@/components/container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAchievements, AchievementsList } from "@/features/achievements";
import { ChevronLeft } from "lucide-react-native";

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievementId } = useLocalSearchParams<{ achievementId?: string }>();
  const { data: achievements, isLoading, error } = useAchievements();

  const highlightAchievementId = achievementId ? parseInt(achievementId, 10) : undefined;

  return (
    <Container className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-white flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
        >
          <ChevronLeft size={24} color="#364153" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-3">Conquistas</Text>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2B7FFF" />
          <Text className="text-sm text-gray-500 mt-3">
            Carregando conquistas...
          </Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View className="px-5 py-3.5">
          <View className="bg-red-50 border border-red-200 rounded-xl p-4">
            <Text className="text-sm font-semibold text-red-900 mb-1">
              Erro ao carregar conquistas
            </Text>
            <Text className="text-xs text-red-700">
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
