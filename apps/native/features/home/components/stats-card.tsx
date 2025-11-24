import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { ChevronRight, Search } from "lucide-react-native";
import { useUserStreak } from "@/features/gamification/hooks";
import { useWeeklyStats } from "@/features/gamification/hooks";
import { useRouter } from "expo-router";

export function StatsCard() {
  const router = useRouter();
  const { data: streak, isLoading: streakLoading } = useUserStreak();
  const { data: weeklyStats, isLoading: statsLoading } = useWeeklyStats();
  const streakIllustration = require("../../../assets/streak.png");
  const questionIllustration = require("../../../assets/question.png");
  const articleIllustration = require("../../../assets/scroll.png");
  const trailIllustration = require("../../../assets/trail.png");

  const weeklyHighlights = [
    {
      id: "questions",
      label: "perguntas",
      value: weeklyStats?.questionsCompleted ?? 0,
      illustration: questionIllustration,
      valueClass: "text-primary",
      imageSize: 28,
    },
    {
      id: "articles",
      label: "artigos",
      value: weeklyStats?.articlesRead ?? 0,
      illustration: articleIllustration,
      valueClass: "text-green-600",
      imageSize: 26,
    },
    {
      id: "trails",
      label: "trilhas",
      value: weeklyStats?.trailsCompleted ?? 0,
      illustration: trailIllustration,
      valueClass: "text-purple-600",
      imageSize: 28,
    },
  ];

  const isLoading = streakLoading || statsLoading;

  if (isLoading) {
    return (
      <View className="mx-5 mb-5 bg-white dark:bg-gray-900 rounded-[14px] border border-gray-200 dark:border-gray-800 p-6 items-center justify-center">
        <ActivityIndicator size="small" color="#155DFC" />
        <Text className="text-xs text-gray-600 dark:text-gray-400 mt-2">Carregando...</Text>
      </View>
    );
  }

  return (
    <View className="mx-5 mb-5 bg-white dark:bg-gray-900 rounded-[14px] border border-gray-200 dark:border-gray-800 overflow-hidden">
      <View className="px-5 pt-5 pb-4 gap-4">
        <TouchableOpacity
          className="flex-row items-center gap-4 rounded-2xl border border-orange-100 px-4 py-3 dark:border-orange-500/30"
          activeOpacity={0.85}
          onPress={() => router.push("/streak")}
        >
          <Image
            source={streakIllustration}
            contentFit="contain"
            style={{ width: 36, height: 36 }}
          />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-orange-900 dark:text-orange-200 uppercase">
              Sequência
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                {streak?.currentStreak ?? 0}
              </Text>
              <Text className="text-sm text-gray-700 dark:text-gray-300">dias consecutivos</Text>
            </View>
          </View>
          <Search size={22} color="#1D4ED8" strokeWidth={2.2} />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-xs text-gray-600 dark:text-gray-400">
            Seu crescimento essa semana
          </Text>
        </View>

        <View className="flex-row gap-3">
          {weeklyHighlights.map((item) => (
            <View
              key={item.id}
              className="flex-1 bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-3 py-4 items-center"
            >
              <View className="w-11 h-11 rounded-full bg-white dark:bg-gray-900 items-center justify-center mb-2">
                <Image
                  source={item.illustration}
                  contentFit="contain"
                  style={{ width: item.imageSize, height: item.imageSize }}
                />
              </View>
              <Text className={`text-2xl font-semibold ${item.valueClass} dark:text-gray-50`}>
                {item.value}
              </Text>
              <Text className="text-xs text-gray-600 dark:text-gray-400 text-center whitespace-nowrap">
                {item.label}
              </Text>
            </View>
          ))}
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
