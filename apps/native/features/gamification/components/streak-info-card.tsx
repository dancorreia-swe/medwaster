import { Text, View, TouchableOpacity } from "react-native";
import { Flame, Snowflake, Trophy } from "lucide-react-native";
import type { UserStreakResponse } from "@server/modules/gamification/model";

interface StreakInfoCardProps {
  streak: UserStreakResponse;
  onUseFreeze?: () => void;
}

export function StreakInfoCard({ streak, onUseFreeze }: StreakInfoCardProps) {
  return (
    <View className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      {/* Current Streak */}
      <View className="items-center mb-6">
        <View className="w-20 h-20 bg-orange-100 rounded-full items-center justify-center mb-3">
          <Flame size={40} color="#FF6900" strokeWidth={2} />
        </View>
        <Text className="text-4xl font-bold text-gray-900">
          {streak.currentStreak}
        </Text>
        <Text className="text-sm text-gray-600">dias de sequência</Text>
      </View>

      {/* Stats Grid */}
      <View className="flex-row gap-4 mb-6">
        {/* Longest Streak */}
        <View className="flex-1 bg-purple-50 rounded-lg p-4 items-center">
          <Trophy size={20} color="#9810FA" strokeWidth={2} />
          <Text className="text-2xl font-bold text-purple-900 mt-2">
            {streak.longestStreak}
          </Text>
          <Text className="text-xs text-purple-700 text-center mt-1">
            Maior sequência
          </Text>
        </View>

        {/* Freezes Available */}
        <View className="flex-1 bg-blue-50 rounded-lg p-4 items-center">
          <Snowflake size={20} color="#155DFC" strokeWidth={2} />
          <Text className="text-2xl font-bold text-blue-900 mt-2">
            {streak.freezesAvailable}
          </Text>
          <Text className="text-xs text-blue-700 text-center mt-1">
            Congelamentos
          </Text>
        </View>
      </View>

      {/* Next Milestone */}
      {streak.nextMilestone && (
        <View className="bg-gray-50 rounded-lg p-4 mb-4">
          <Text className="text-xs font-semibold text-gray-600 uppercase mb-2">
            Próxima Conquista
          </Text>
          <Text className="text-base font-bold text-gray-900 mb-1">
            {streak.nextMilestone.title}
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            {streak.nextMilestone.description}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-600">
              Faltam {streak.daysUntilNextMilestone} dias
            </Text>
            {streak.nextMilestone.freezeReward > 0 && (
              <View className="flex-row items-center gap-1">
                <Snowflake size={12} color="#155DFC" strokeWidth={2} />
                <Text className="text-xs font-semibold text-primary">
                  +{streak.nextMilestone.freezeReward}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Use Freeze Button */}
      {streak.canUseFreeze && onUseFreeze && (
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-3 items-center"
          onPress={onUseFreeze}
        >
          <Text className="text-white font-semibold">
            Usar Congelamento
          </Text>
        </TouchableOpacity>
      )}

      {/* Info */}
      <View className="bg-amber-50 rounded-lg p-3 mt-4">
        <Text className="text-xs text-amber-900">
          💡 Complete pelo menos uma atividade por dia para manter sua
          sequência! Use congelamentos para proteger sua sequência em dias que
          não puder estudar.
        </Text>
      </View>
    </View>
  );
}
