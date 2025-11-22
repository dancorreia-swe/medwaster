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

  // Use UTC methods to avoid timezone conversion issues
  const day = parsed.getUTCDate();
  const monthNames = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  const month = monthNames[parsed.getUTCMonth()];

  return `${day.toString().padStart(2, "0")} de ${month}`;
}

export function StreakInfoCard({ streak }: StreakInfoCardProps) {
  const currentStreak = Math.max(streak.currentStreak, 1);
  const longestStreak = Math.max(streak.longestStreak, currentStreak);
  const totalActiveDays = Math.max(streak.totalActiveDays, currentStreak);
  const nextMilestoneDays = streak.nextMilestone?.days ?? null;
  const milestoneProgress = nextMilestoneDays
    ? Math.min(currentStreak / nextMilestoneDays, 1)
    : 0;
  const streakIllustration = require("../../../assets/streak.png");

  // When the backend hasn't persisted streak dates yet (first login), infer "today"
  const todayIso = new Date().toISOString();
  const shouldInferStart = currentStreak > 0 && !streak.currentStreakStartDate;
  const shouldInferLast = currentStreak > 0 && !streak.lastActivityDate;
  const inferredToday = shouldInferStart || shouldInferLast ? todayIso : null;
  const startDateForDisplay =
    streak.currentStreakStartDate ?? streak.lastActivityDate ?? inferredToday;
  const lastActivityForDisplay =
    streak.lastActivityDate ?? streak.currentStreakStartDate ?? inferredToday;

  return (
    <View className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 dark:bg-gray-900 dark:border-gray-800">
      {/* Current Streak */}
      <View className="flex-row items-center justify-between bg-orange-50 rounded-2xl px-5 py-4 mb-6 dark:bg-orange-500/20">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-semibold text-orange-800 uppercase dark:text-orange-200">
            Sequência Atual
          </Text>
          <Text className="text-4xl font-bold text-gray-900 dark:text-gray-50 mt-1">
            {currentStreak}
          </Text>
          <Text className="text-sm text-gray-700 dark:text-gray-300">dias consecutivos</Text>
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
        <View className="flex-1 bg-purple-50 rounded-2xl px-5 py-6 dark:bg-purple-500/10">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center dark:bg-purple-500/30">
              <Trophy size={18} color="#6B21A8" strokeWidth={2} />
            </View>
            <Text className="text-xs font-semibold text-purple-900 uppercase flex-1 leading-4 dark:text-purple-100">
              Maior sequência
            </Text>
          </View>
          <Text className="text-4xl font-bold text-purple-900 dark:text-purple-100">
            {longestStreak}
          </Text>
          <Text className="text-xs text-purple-700 mt-2 dark:text-purple-200">
            dias no seu melhor período
          </Text>
        </View>

        <View className="flex-1 bg-blue-50 rounded-2xl px-5 py-6 dark:bg-blue-500/10">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center dark:bg-blue-500/30">
              <Activity size={18} color="#1D4ED8" strokeWidth={2} />
            </View>
            <Text className="text-xs font-semibold text-blue-900 uppercase flex-1 leading-4 dark:text-blue-100">
              Dias ativos
            </Text>
          </View>
          <Text className="text-4xl font-bold text-blue-900 dark:text-blue-100">
            {totalActiveDays}
          </Text>
          <Text className="text-xs text-blue-700 mt-2 dark:text-blue-200">
            desde que você entrou
          </Text>
        </View>
      </View>

      <View className="bg-gray-50 rounded-xl p-4 mb-5 dark:bg-gray-800">
        <Text className="text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
          Linha do tempo
        </Text>
        <View className="flex-row items-center gap-3 mt-3">
          <View className="flex-row items-center gap-2 flex-1">
            <CalendarDays size={16} color="#9CA3AF" strokeWidth={2} />
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400">Início da sequência</Text>
              <Text className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {formatDateLabel(startDateForDisplay)}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2 flex-1">
            <CalendarDays size={16} color="#9CA3AF" strokeWidth={2} />
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400">Último dia ativo</Text>
              <Text className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {formatDateLabel(lastActivityForDisplay)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {streak.nextMilestone && (
        <View className="bg-gray-50 rounded-2xl p-4 dark:bg-gray-800">
          <Text className="text-xs font-semibold text-gray-600 uppercase mb-2 dark:text-gray-400">
            Próxima Conquista
          </Text>
          <Text className="text-base font-bold text-gray-900 dark:text-gray-50 mb-1">
            {streak.nextMilestone.title}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {streak.nextMilestone.description}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              Faltam {streak.daysUntilNextMilestone} dias
            </Text>
            <Text className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              Meta: {streak.nextMilestone.days} dias
            </Text>
          </View>
          <View className="h-2 bg-white rounded-full overflow-hidden mt-3 dark:bg-gray-700">
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
