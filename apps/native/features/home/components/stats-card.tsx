import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Flame, ChevronRight } from "lucide-react-native";
import { useUserStreak } from "@/features/gamification/hooks";
import { useWeeklyStats } from "@/features/gamification/hooks";
import { useRouter } from "expo-router";

export function StatsCard() {
  const router = useRouter();
  const { data: streak, isLoading: streakLoading } = useUserStreak();
  const { data: weeklyStats, isLoading: statsLoading } = useWeeklyStats();

  const isLoading = streakLoading || statsLoading;

  if (isLoading) {
    return (
      <View className="mx-5 mb-5 bg-white rounded-[14px] border border-gray-200 p-6 items-center justify-center">
        <ActivityIndicator size="small" color="#155DFC" />
        <Text className="text-xs text-gray-600 mt-2">Carregando...</Text>
      </View>
    );
  }

  return (
    <View className="mx-5 mb-5 bg-white rounded-[14px] border border-gray-200 overflow-hidden">
      {/* Stats Row */}
      <View className="flex-row gap-3">
        {/* Streak Box - Isolated */}
        <TouchableOpacity
          className="px-6 py-3 items-center gap-2.5 border-r border-gray-200"
          onPress={() => router.push("/streak")}
        >
          <Text className="text-xs text-gray-600">Sequência</Text>
          <View className="items-center gap-1 flex-1">
            <View className="flex-row items-center gap-x-1.5">
              <Flame size={16} color="#FF6900" strokeWidth={1.5} />
              <Text className="text-2xl font-semibold text-gray-900">
                {streak?.currentStreak ?? 0}
              </Text>
            </View>
            <Text className="text-xs text-gray-600">dias</Text>
          </View>
        </TouchableOpacity>

        {/* Other Stats */}
        <View className="flex-1 gap-2.5 py-3">
          {/* Label */}
          <View className="items-center">
            <Text className="text-xs text-gray-600">
              Seu crescimento essa semana
            </Text>
          </View>
          {/* Stats Grid */}
          <View className="flex-row justify-between">
            <View className="items-center gap-1 flex-1">
              <Text className="text-2xl font-semibold text-primary">
                {weeklyStats?.questionsCompleted ?? 0}
              </Text>
              <Text className="text-xs text-gray-600">perguntas</Text>
            </View>

            <View className="items-center gap-1 flex-1">
              <Text className="text-2xl font-semibold text-green-600">
                {weeklyStats?.articlesRead ?? 0}
              </Text>
              <Text className="text-xs text-gray-600">artigos</Text>
            </View>

            <View className="items-center gap-1 flex-1">
              <Text className="text-2xl font-semibold text-purple-600">
                {weeklyStats?.trailContentCompleted ?? 0}
              </Text>
              <Text className="text-xs text-gray-600">trilhas</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Daily Mission Button */}
      <TouchableOpacity
        className="bg-primary flex-row items-center justify-between px-[17.5px] py-3 rounded-b-[14px]"
        onPress={() => router.push("/missions")}
      >
        <Text className="text-white text-xs font-bold tracking-[0.024em] uppercase">
          Sua missão diária
        </Text>
        <ChevronRight size={17.5} color="#FFFFFF" strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );
}
