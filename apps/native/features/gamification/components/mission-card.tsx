import { Text, View } from "react-native";
import { CheckCircle2, Circle } from "lucide-react-native";
import type { UserMissionResponse } from "@server/modules/gamification/model";

interface MissionCardProps {
  mission: UserMissionResponse;
}

const missionTypeLabels: Record<string, string> = {
  complete_questions: "Responder Perguntas",
  complete_quiz: "Completar Quiz",
  complete_trail_content: "Completar Trilhas",
  read_article: "Ler Artigos",
  bookmark_articles: "Favoritar Artigos",
  login_daily: "Login Diário",
  achieve_score: "Atingir Pontuação",
  spend_time_learning: "Tempo de Estudo",
  complete_streak: "Manter Sequência",
};

export function MissionCard({ mission }: MissionCardProps) {
  const isCompleted = mission.isCompleted;
  const progress = mission.progressPercentage;

  return (
    <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {mission.mission.title}
          </Text>
          <Text className="text-sm text-gray-600">
            {mission.mission.description}
          </Text>
        </View>
        <View className="ml-3">
          {isCompleted ? (
            <CheckCircle2 size={24} color="#00A63E" strokeWidth={2} />
          ) : (
            <Circle size={24} color="#D1D5DB" strokeWidth={2} />
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mb-2">
        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <View
            className={`h-full ${isCompleted ? "bg-green-600" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Progress Text */}
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-600">
          {mission.currentProgress} / {mission.mission.targetValue}
        </Text>
        <Text
          className={`text-xs font-semibold ${isCompleted ? "text-green-600" : "text-primary"}`}
        >
          {progress}%
        </Text>
      </View>
    </View>
  );
}
