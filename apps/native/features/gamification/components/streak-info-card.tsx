import { Text, View } from "react-native";
import { Image } from "expo-image";
import { Activity, CalendarDays, Trophy } from "lucide-react-native";
import type { UserStreakResponse } from "@server/modules/gamification/model";

interface StreakInfoCardProps {
  streak: UserStreakResponse;
}

function formatDateLabel(date?: string | null) {
  if (!date) return "--";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function StreakInfoCard({ streak }: StreakInfoCardProps) {
  const nextMilestoneDays = streak.nextMilestone?.days ?? null;
  const milestoneProgress = nextMilestoneDays
    ? Math.min(streak.currentStreak / nextMilestoneDays, 1)
    : 0;
  const streakIllustration = require("../../../assets/streak.png");

  return (
    <View className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
      {/* Current Streak */}
      <View className="flex-row items-center justify-between bg-orange-50 rounded-2xl px-5 py-4 mb-6">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-semibold text-orange-800 uppercase">
            Sequência Atual
          </Text>
          <Text className="text-4xl font-bold text-gray-900 mt-1">
            {streak.currentStreak}
          </Text>
          <Text className="text-sm text-gray-700">dias consecutivos</Text>
        </View>
        <View className="w-20 h-20">
          <Image
            source={streakIllustration}
            contentFit="contain"
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      </View>

      {/* Stats Grid */}
      <View className="flex-row gap-4 mb-5">
        <View className="flex-1 bg-purple-50 rounded-2xl px-5 py-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
              <Trophy size={18} color="#6B21A8" strokeWidth={2} />
            </View>
            <Text className="text-xs font-semibold text-purple-900 uppercase flex-1 leading-4">
              Maior sequência
            </Text>
          </View>
          <Text className="text-4xl font-bold text-purple-900">
            {streak.longestStreak}
          </Text>
          <Text className="text-xs text-purple-700 mt-2">
            dias no seu melhor período
          </Text>
        </View>

        <View className="flex-1 bg-blue-50 rounded-2xl px-5 py-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
              <Activity size={18} color="#1D4ED8" strokeWidth={2} />
            </View>
            <Text className="text-xs font-semibold text-blue-900 uppercase flex-1 leading-4">
              Dias ativos
            </Text>
          </View>
          <Text className="text-4xl font-bold text-blue-900">
            {streak.totalActiveDays}
          </Text>
          <Text className="text-xs text-blue-700 mt-2">
            desde que você entrou
          </Text>
        </View>
      </View>

      <View className="bg-gray-50 rounded-xl p-4 mb-5">
        <Text className="text-xs font-semibold text-gray-600 uppercase">
          Linha do tempo
        </Text>
        <View className="flex-row items-center gap-3 mt-3">
          <View className="flex-row items-center gap-2 flex-1">
            <CalendarDays size={16} color="#4B5563" strokeWidth={2} />
            <View>
              <Text className="text-xs text-gray-500">Início da sequência</Text>
              <Text className="text-base font-semibold text-gray-900">
                {formatDateLabel(streak.currentStreakStartDate)}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2 flex-1">
            <CalendarDays size={16} color="#4B5563" strokeWidth={2} />
            <View>
              <Text className="text-xs text-gray-500">Último dia ativo</Text>
              <Text className="text-base font-semibold text-gray-900">
                {formatDateLabel(streak.lastActivityDate)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {streak.nextMilestone && (
        <View className="bg-gray-50 rounded-2xl p-4">
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
            <Text className="text-xs font-semibold text-gray-900">
              Meta: {streak.nextMilestone.days} dias
            </Text>
          </View>
          <View className="h-2 bg-white rounded-full overflow-hidden mt-3">
            <View
              className="h-full bg-orange-500"
              style={{ width: `${milestoneProgress * 100}%` }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
