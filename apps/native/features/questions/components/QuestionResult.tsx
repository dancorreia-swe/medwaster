import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react-native";
import type { QuestionResultProps, Question } from "../types";
import { MatchingPairsList } from "./MatchingPairsList";
import { getMatchingPairsForDisplay } from "../utils";

/**
 * Question Result Component
 * Displays feedback after question submission (without button - handled by parent)
 */
export function QuestionResult({ result, question }: QuestionResultProps) {
  const isCorrect = result.isCorrect;

  const [showFullExplanation, setShowFullExplanation] = useState(false);

  const explanationPreview = useMemo(() => {
    if (!result.explanation) return "";
    const max = 160;
    return result.explanation.length > max
      ? `${result.explanation.slice(0, max)}...`
      : result.explanation;
  }, [result.explanation]);

  return (
    <View className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm">
      {/* Result Header */}
      <View className="flex-row items-center gap-3 mb-4">
        {isCorrect ? (
          <CheckCircle2 size={28} color="#16A34A" strokeWidth={2.5} />
        ) : (
          <XCircle size={28} color="#EF4444" strokeWidth={2.5} />
        )}

        <Text
          className={`text-xl font-bold ${
            isCorrect ? "text-green-700" : "text-red-700"
          }`}
        >
          {isCorrect ? "Resposta Correta!" : "Resposta Incorreta"}
        </Text>
      </View>

      {/* Status chips */}
      <View className="flex-row items-center flex-wrap gap-2 mb-5">
        {typeof result.score === "number" && (
          <Pill
            label={`Pontuação ${result.score}%`}
            color="#2563EB"
            icon={Sparkles}
          />
        )}
        {typeof result.earnedPoints === "number" && result.earnedPoints > 0 && (
          <Pill label={`+${result.earnedPoints} pts`} color="#2563EB" />
        )}
      </View>

      {/* Explanation */}
      {result.explanation && (
        <View className="mb-5 gap-2">
          <Text className="text-xs font-semibold text-gray-600 tracking-wide">
            EXPLICAÇÃO
          </Text>
          <Text className="text-base leading-relaxed text-gray-900">
            {showFullExplanation ? result.explanation : explanationPreview}
          </Text>
          {result.explanation.length > explanationPreview.length && (
            <TouchableOpacity
              onPress={() => setShowFullExplanation((v) => !v)}
              className="self-start"
            >
              <Text className="text-sm font-semibold text-blue-600">
                {showFullExplanation ? "Ver menos" : "Ver mais"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Correct Answer (if incorrect) */}
      {!isCorrect && result.correctAnswer !== undefined && (
        <View>
          <Text className="text-xs font-semibold text-gray-600 tracking-wide mb-2">
            RESPOSTA CORRETA
          </Text>
          {question?.type === "matching" ? (
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              {formatMatchingAnswer(
                result.correctAnswer as Record<string, string>,
                question,
              )}
            </View>
          ) : question?.type === "fill_in_the_blank" ? (
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 gap-3">
              {formatFillInBlankAnswer(
                result.correctAnswer as Record<string, string>,
                (result.userAnswer as Record<string, string>) || {},
                question,
              )}
            </View>
          ) : (
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
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
 * Helper function to format fill-in-blank answers with visual feedback
 */
function formatFillInBlankAnswer(
  correctAnswer: Record<string, string>,
  userAnswer: Record<string, string>,
  question?: Question,
) {
  if (!question?.fillInBlanks) {
    return Object.entries(correctAnswer).map(([blankId, correct], index) => {
      const user = userAnswer?.[blankId] || "";
      const isCorrect = user === correct;

      return (
        <View key={blankId} className={index > 0 ? "mt-3" : ""}>
          <View className="flex-row items-center gap-2 mb-2">
            {isCorrect ? (
              <CheckCircle2 size={16} color="#16A34A" strokeWidth={2.5} />
            ) : (
              <XCircle size={16} color="#EF4444" strokeWidth={2.5} />
            )}
            <Text className="text-sm font-semibold text-gray-700">
              Espaço {index + 1}
            </Text>
          </View>
          {!isCorrect && user && (
            <View className="bg-red-50 rounded-lg p-3 mb-2 border border-red-200">
              <Text className="text-xs font-semibold text-red-600 mb-1">
                SUA RESPOSTA
              </Text>
              <Text className="text-base text-red-900">{user}</Text>
            </View>
          )}
          <View className="bg-green-50 rounded-lg p-3 border border-green-200">
            <Text className="text-xs font-semibold text-green-600 mb-1">
              CORRETO
            </Text>
            <Text className="text-base text-green-900">{correct}</Text>
          </View>
        </View>
      );
    });
  }

  return question.fillInBlanks
    .sort((a, b) => a.sequence - b.sequence)
    .map((blank, index) => {
      const blankId = blank.id.toString();
      const correct = correctAnswer[blankId];
      const user = userAnswer?.[blankId] || "";
      const isCorrect = user === correct;

      return (
        <View key={blank.id} className={index > 0 ? "mt-3" : ""}>
          <View className="flex-row items-center gap-2 mb-2">
            {isCorrect ? (
              <CheckCircle2 size={16} color="#16A34A" strokeWidth={2.5} />
            ) : (
              <XCircle size={16} color="#EF4444" strokeWidth={2.5} />
            )}
            <Text className="text-sm font-semibold text-gray-700">
              Espaço {blank.sequence}
              {blank.placeholder && `: ${blank.placeholder}`}
            </Text>
          </View>
          {!isCorrect && user && (
            <View className="bg-red-50 rounded-lg p-3 mb-2 border border-red-200">
              <Text className="text-xs font-semibold text-red-600 mb-1">
                SUA RESPOSTA
              </Text>
              <Text className="text-base text-red-900">{user}</Text>
            </View>
          )}
          <View className="bg-green-50 rounded-lg p-3 border border-green-200">
            <Text className="text-xs font-semibold text-green-600 mb-1">
              CORRETO
            </Text>
            <Text className="text-base text-green-900">{correct}</Text>
          </View>
        </View>
      );
    });
}

/**
 * Helper function to format matching pairs as visual components
 */
function formatMatchingAnswer(
  answer: Record<string, string>,
  question?: Question,
) {
  const pairs = getMatchingPairsForDisplay(answer, question?.matchingPairs);

  if (!pairs.length) {
    return (
      <Text className="text-base text-gray-900">
        {Object.entries(answer)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")}
      </Text>
    );
  }

  return <MatchingPairsList pairs={pairs} tone="success" />;
}

/**
 * Helper function to format correct answer for display
 */
function formatCorrectAnswer(
  answer: number | number[] | string | Record<string, string>,
  question?: Question,
): string {
  if (typeof answer === "string") {
    return answer;
  }

  if (typeof answer === "number") {
    // Try to find the option text from the question
    if (question?.options) {
      const option = question.options.find((opt) => opt.id === answer);
      if (option) {
        return (
          (option as any).content || option.optionText || `Opção ${answer}`
        );
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
            (p) => p.id.toString() === leftId,
          );
          const rightPair = question.matchingPairs!.find(
            (p) => p.id.toString() === rightId,
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
            (b) => b.id.toString() === blankId,
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

// -----------------
// Small pill chip
// -----------------
type PillProps = {
  label: string;
  color: string;
  icon?: typeof CheckCircle2;
};

function Pill({ label, color, icon: Icon }: PillProps) {
  return (
    <View
      className="flex-row items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        borderWidth: 1,
      }}
    >
      {Icon && <Icon size={16} color={color} strokeWidth={2.25} />}
      <Text className="text-sm font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
