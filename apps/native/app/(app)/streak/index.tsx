import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/container";
import {
  useUserStreak,
  useUseStreakFreeze,
  useStreakMilestones,
} from "@/features/gamification/hooks";
import { StreakInfoCard } from "@/features/gamification/components/streak-info-card";
import { ChevronLeft, Trophy, CheckCircle2 } from "lucide-react-native";

export default function StreakScreen() {
  const router = useRouter();
  const { data: streak, isLoading: streakLoading } = useUserStreak();
  const { data: milestones, isLoading: milestonesLoading } =
    useStreakMilestones();
  const useFreezeMutation = useUseStreakFreeze();

  const isLoading = streakLoading || milestonesLoading;

  const handleUseFreeze = () => {
    if (!streak?.canUseFreeze) {
      Alert.alert(
        "Sem Congelamentos",
        "Você não tem congelamentos disponíveis.",
      );
      return;
    }

    Alert.alert(
      "Usar Congelamento",
      "Tem certeza que deseja usar um congelamento para proteger sua sequência hoje?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Usar",
          style: "default",
          onPress: () => {
            useFreezeMutation.mutate(undefined, {
              onSuccess: () => {
                Alert.alert(
                  "Sucesso!",
                  "Congelamento usado com sucesso. Sua sequência está protegida!",
                );
              },
              onError: (error) => {
                Alert.alert(
                  "Erro",
                  error.message || "Não foi possível usar o congelamento.",
                );
              },
            });
          },
        },
      ],
    );
  };

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
        <Text className="text-lg font-bold text-gray-900 ml-3">Sequência</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#155DFC" />
          <Text className="text-gray-600 mt-3">Carregando sequência...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 py-4">
          {streak && (
            <StreakInfoCard streak={streak} onUseFreeze={handleUseFreeze} />
          )}

          {/* Milestones Section */}
          {milestones && milestones.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Conquistas de Sequência
              </Text>

              {milestones.map((achievement) => (
                <View
                  key={achievement.milestoneId}
                  className="bg-white rounded-xl border border-gray-200 p-4 mb-3 flex-row items-center"
                >
                  <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                    <CheckCircle2 size={24} color="#00A63E" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {achievement.milestone.title}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {achievement.milestone.days} dias de sequência
                    </Text>
                    {achievement.milestone.freezeReward > 0 && (
                      <Text className="text-xs text-green-600 font-semibold mt-1">
                        +{achievement.milestone.freezeReward} congelamentos
                      </Text>
                    )}
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
