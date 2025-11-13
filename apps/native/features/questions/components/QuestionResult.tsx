import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CheckCircle2, XCircle, Award } from "lucide-react-native";
import type { QuestionResultProps } from "../types";

/**
 * Question Result Component
 * Displays feedback after question submission
 */
export function QuestionResult({
  result,
  onContinue,
  isLoading = false,
}: QuestionResultProps) {
  const isCorrect = result.isCorrect;

  return (
    <View
      className={`rounded-xl p-6 ${
        isCorrect
          ? "bg-green-50 border-2 border-green-200"
          : "bg-red-50 border-2 border-red-200"
      }`}
    >
      {/* Result Header */}
      <View className="flex-row items-center gap-3 mb-4">
        {isCorrect ? (
          <View className="w-14 h-14 rounded-full bg-green-500 items-center justify-center">
            <CheckCircle2 size={32} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        ) : (
          <View className="w-14 h-14 rounded-full bg-red-500 items-center justify-center">
            <XCircle size={32} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        )}

        <View className="flex-1">
          <Text
            className={`text-xl font-bold mb-1 ${
              isCorrect ? "text-green-900" : "text-red-900"
            }`}
          >
            {isCorrect ? "Resposta Correta!" : "Resposta Incorreta"}
          </Text>
          {result.earnedPoints !== undefined && result.earnedPoints > 0 && (
            <View className="flex-row items-center gap-1">
              <Award size={16} color={isCorrect ? "#10B981" : "#EF4444"} />
              <Text
                className={`text-sm font-semibold ${
                  isCorrect ? "text-green-700" : "text-red-700"
                }`}
              >
                +{result.earnedPoints}{" "}
                {result.earnedPoints === 1 ? "ponto" : "pontos"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Score (if available) */}
      {result.score !== undefined && result.score !== null && (
        <View className="mb-4">
          <View className="bg-white rounded-lg p-3 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-700">
              Pontuação
            </Text>
            <Text
              className={`text-lg font-bold ${
                isCorrect ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.score}%
            </Text>
          </View>
        </View>
      )}

      {/* Explanation */}
      {result.explanation && (
        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Explicação:
          </Text>
          <Text className="text-base text-gray-800 leading-relaxed">
            {result.explanation}
          </Text>
        </View>
      )}

      {/* Correct Answer (if incorrect) */}
      {!isCorrect && result.correctAnswer !== undefined && (
        <View className="mb-5">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Resposta Correta:
          </Text>
          <View className="bg-white rounded-lg p-3">
            <Text className="text-base text-gray-900">
              {formatCorrectAnswer(result.correctAnswer)}
            </Text>
          </View>
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        onPress={onContinue}
        disabled={isLoading}
        className={`rounded-full py-4 items-center ${
          isCorrect ? "bg-green-600" : "bg-red-600"
        } ${isLoading ? "opacity-70" : ""}`}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white text-base font-semibold">Continuar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/**
 * Helper function to format correct answer for display
 */
function formatCorrectAnswer(
  answer: number | number[] | string | Record<string, string>
): string {
  if (typeof answer === "string") {
    return answer;
  }

  if (typeof answer === "number") {
    return `Opção ${answer}`;
  }

  if (Array.isArray(answer)) {
    return answer.map((id) => `Opção ${id}`).join(", ");
  }

  if (typeof answer === "object") {
    // For matching or fill-in-blank answers
    return Object.entries(answer)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  return "Resposta não disponível";
}
