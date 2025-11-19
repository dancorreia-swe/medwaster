import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/container";
import {
  useUserStreak,
  useStreakMilestones,
  useActivityHistory,
} from "@/features/gamification/hooks";
import { StreakInfoCard } from "@/features/gamification/components/streak-info-card";
import { StreakCalendar } from "@/features/gamification/components/streak-calendar";
import { ChevronLeft, Trophy, Medal } from "lucide-react-native";

export default function StreakScreen() {
  const router = useRouter();
  const { data: streak, isLoading: streakLoading } = useUserStreak();
  const { data: milestones, isLoading: milestonesLoading } =
    useStreakMilestones();
  const weeksToShow = 5;
  const { data: activityHistory, isLoading: activityHistoryLoading } =
    useActivityHistory(weeksToShow * 7);

  const isLoading = streakLoading || milestonesLoading;

  return (
    <Container className="flex-1 ">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-white flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
        >
          <ChevronLeft size={24} color="#364153" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-3">Sequência</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#155DFC" />
          <Text className="text-gray-600 mt-3">Carregando sequência...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 py-4"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {streak && <StreakInfoCard streak={streak} />}

          <View className="mb-6">
            <StreakCalendar
              activities={activityHistory}
              isLoading={activityHistoryLoading}
              weeks={weeksToShow}
            />
          </View>

          {/* Milestones Section */}
          {milestones && milestones.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Conquistas de Sequência
              </Text>

              {milestones.map((achievement, index) => (
                <View
                  key={achievement.milestoneId}
                  className={`bg-white rounded-xl border border-gray-200 p-4 flex-row items-center ${index !== milestones.length - 1 ? "mb-3" : ""}`}
                >
                  <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                    <Medal size={24} color="#059669" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {achievement.milestone.title}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {achievement.milestone.days} dias de sequência
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {(!milestones || milestones.length === 0) && (
            <View className="bg-white rounded-xl border border-gray-200 p-6 items-center">
              <Trophy size={48} color="#D1D5DB" strokeWidth={1.5} />
              <Text className="text-gray-900 font-semibold mt-3">
                Nenhuma conquista ainda
              </Text>
              <Text className="text-gray-600 text-sm text-center mt-1">
                Continue sua sequência para desbloquear conquistas!
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </Container>
  );
}
