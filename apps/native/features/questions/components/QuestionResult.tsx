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
          {question?.type === "matching" ? (
            <View className="bg-white rounded-xl p-4 border border-gray-200 gap-2">
              {formatMatchingAnswer(result.correctAnswer as Record<string, string>, question)}
            </View>
          ) : (
            <View className="bg-white rounded-xl p-4 border border-gray-200">
              <Text className="text-base text-gray-900">
                {formatCorrectAnswer(result.correctAnswer, question)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Helper function to format matching pairs as visual components
 */
function formatMatchingAnswer(
  answer: Record<string, string>,
  question?: Question
) {
  if (!question?.matchingPairs) {
    return (
      <Text className="text-base text-gray-900">
        {Object.entries(answer)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")}
      </Text>
    );
  }

  return Object.entries(answer).map(([leftId, rightId], index) => {
    const leftPair = question.matchingPairs!.find(
      (p) => p.id.toString() === leftId
    );
    const rightPair = question.matchingPairs!.find(
      (p) => p.id.toString() === rightId
    );

    const leftText = leftPair?.leftText || leftId;
    const rightText = rightPair?.rightText || rightId;

    return (
      <View
        key={`${leftId}-${rightId}`}
        className={`flex-row items-center gap-3 ${
          index > 0 ? "mt-2" : ""
        }`}
      >
        <View className="flex-1 bg-blue-50 rounded-lg p-3">
          <Text className="text-sm text-gray-900">{leftText}</Text>
        </View>
        <Text className="text-gray-400 text-lg">→</Text>
        <View className="flex-1 bg-green-50 rounded-lg p-3">
          <Text className="text-sm text-gray-900">{rightText}</Text>
        </View>
      </View>
    );
  });
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
    // For matching pairs - show as formatted list
    if (question?.type === "matching" && question.matchingPairs) {
      const entries = Object.entries(answer);
      return entries
        .map(([leftId, rightId]) => {
          const pair = question.matchingPairs!.find(
            (p) => p.id.toString() === leftId
          );
          const rightPair = question.matchingPairs!.find(
            (p) => p.id.toString() === rightId
          );
          
          const leftText = pair?.leftText || leftId;
          const rightText = rightPair?.rightText || rightId;
          
          return `${leftText} → ${rightText}`;
        })
        .join("\n");
    }
    
    // For fill-in-blank answers
    if (question?.type === "fill_in_blank" && question.fillInBlanks) {
      const entries = Object.entries(answer);
      return entries
        .map(([blankId, value]) => {
          const blank = question.fillInBlanks!.find(
            (b) => b.id.toString() === blankId
          );
          const placeholder = blank?.placeholder || blankId;
          return `${placeholder}: ${value}`;
        })
        .join("\n");
    }
    
    // Fallback for other object types
    return Object.entries(answer)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  return "Resposta não disponível";
}
