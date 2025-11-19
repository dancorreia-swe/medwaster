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
      <View className="mx-5 mb-5 bg-white rounded-[14px] border border-gray-200 p-6 items-center justify-center">
        <ActivityIndicator size="small" color="#155DFC" />
        <Text className="text-xs text-gray-600 mt-2">Carregando...</Text>
      </View>
    );
  }

  return (
    <View className="mx-5 mb-5 bg-white rounded-[14px] border border-gray-200 overflow-hidden">
      <View className="px-5 pt-5 pb-4 gap-4">
        <TouchableOpacity
          className="flex-row items-center gap-4 bg-orange-50 rounded-2xl px-4 py-3"
          activeOpacity={0.85}
          onPress={() => router.push("/streak")}
        >
          <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center">
            <Image
              source={streakIllustration}
              contentFit="contain"
              style={{ width: 52, height: 52 }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-orange-900 uppercase">
              Sequência
            </Text>
            <View className="flex-row items-baseline gap-2 mt-1">
              <Text className="text-3xl font-bold text-gray-900">
                {streak?.currentStreak ?? 0}
              </Text>
              <Text className="text-sm text-gray-700">dias consecutivos</Text>
            </View>
          </View>
          <Search size={22} color="#1D4ED8" strokeWidth={2.2} />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-xs text-gray-600">
            Seu crescimento essa semana
          </Text>
        </View>

        <View className="flex-row gap-3">
          {weeklyHighlights.map((item) => (
            <View
              key={item.id}
              className="flex-1 bg-gray-50 rounded-2xl px-3 py-4 items-center"
            >
              <View className="w-11 h-11 rounded-full bg-white items-center justify-center mb-2">
                <Image
                  source={item.illustration}
                  contentFit="contain"
                  style={{ width: item.imageSize, height: item.imageSize }}
                />
              </View>
              <Text className={`text-2xl font-semibold ${item.valueClass}`}>
                {item.value}
              </Text>
              <Text className="text-xs text-gray-600 text-center whitespace-nowrap">
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
