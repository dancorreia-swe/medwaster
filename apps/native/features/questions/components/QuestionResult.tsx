import { View, Text } from "react-native";
import { CheckCircle2, XCircle } from "lucide-react-native";
import type { QuestionResultProps, Question } from "../types";

/**
 * Question Result Component
 * Displays feedback after question submission (without button - handled by parent)
 */
export function QuestionResult({
  result,
  question,
}: QuestionResultProps) {
  const isCorrect = result.isCorrect;

  return (
    <View
      className={`rounded-2xl p-6 border-2 ${
        isCorrect
          ? "bg-green-50 border-green-500"
          : "bg-red-50 border-red-500"
      }`}
    >
      {/* Result Header */}
      <View className="flex-row items-center gap-3 mb-4">
        {isCorrect ? (
          <CheckCircle2 size={32} color="#10B981" strokeWidth={2.5} />
        ) : (
          <XCircle size={32} color="#EF4444" strokeWidth={2.5} />
        )}

        <Text
          className={`text-2xl font-bold ${
            isCorrect ? "text-green-700" : "text-red-700"
          }`}
        >
          {isCorrect ? "Resposta Correta!" : "Resposta Incorreta"}
        </Text>
      </View>

      {/* Explanation */}
      {result.explanation && (
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            EXPLICAÇÃO
          </Text>
          <Text className={`text-base leading-relaxed ${
            isCorrect ? "text-green-900" : "text-red-900"
          }`}>
            {result.explanation}
          </Text>
        </View>
      )}

      {/* Correct Answer (if incorrect) */}
      {!isCorrect && result.correctAnswer !== undefined && (
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            RESPOSTA CORRETA
          </Text>
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-base text-gray-900">
              {formatCorrectAnswer(result.correctAnswer, question)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Helper function to format correct answer for display
 */
function formatCorrectAnswer(
  answer: number | number[] | string | Record<string, string>,
  question?: Question
): string {
  if (typeof answer === "string") {
    return answer;
  }

  if (typeof answer === "number") {
    // Try to find the option text from the question
    if (question?.options) {
      const option = question.options.find((opt) => opt.id === answer);
      if (option) {
        return (option as any).content || option.optionText || `Opção ${answer}`;
      }
    }
    return `Opção ${answer}`;
  }

  if (Array.isArray(answer)) {
    // Try to find the option texts from the question
    if (question?.options) {
      return answer
        .map((id) => {
          const option = question.options!.find((opt) => opt.id === id);
          return option
            ? (option as any).content || option.optionText || `Opção ${id}`
            : `Opção ${id}`;
        })
        .join(", ");
    }
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
