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
  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
      {/* Question Counter */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm font-semibold text-gray-700">
          {currentQuestion}/{totalQuestions}
        </Text>
        <Text className="text-xs text-gray-500">
          {answeredQuestions} respondidas
        </Text>
      </View>

      {/* Segmented Progress Bar */}
      <View className="flex-row items-center" style={{ gap: 4 }}>
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const isFilled = index < currentQuestion;
          const isActive = index === currentQuestion - 1;

          return (
            <View
              key={index}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 99,
                backgroundColor: isFilled
                  ? isActive
                    ? "#16a34a"
                    : "#22c55e"
                  : "#d1d5db",
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
