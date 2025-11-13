import { View, Text } from "react-native";
import type { QuizProgressBarProps } from "../types";

/**
 * Quiz Progress Bar Component
 * Shows visual progress through quiz questions
 */
export function QuizProgressBar({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
}: QuizProgressBarProps) {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  const answeredPercentage = (answeredQuestions / totalQuestions) * 100;

  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
      {/* Question Counter */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-semibold text-gray-700">
          Questão {currentQuestion} de {totalQuestions}
        </Text>
        <Text className="text-xs text-gray-500">
          {answeredQuestions} respondidas
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </View>

      {/* Percentage */}
      <Text className="text-xs text-gray-500 mt-1 text-right">
        {Math.round(progressPercentage)}% completo
      </Text>
    </View>
  );
}
