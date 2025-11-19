import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { CheckCircle2, XCircle, ChevronLeft } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { QuizResults } from "../types";
import type { Question } from "../../questions/types";

/**
 * Quiz Review Component
 * Allows users to review their answers after completing a quiz
 */
export interface QuizReviewProps {
  results: QuizResults;
  onClose: () => void;
}

export function QuizReview({ results, onClose }: QuizReviewProps) {
  const { attempt, answers } = results;
  const showCorrectAnswers = attempt.quiz?.showCorrectAnswers ?? true;
  const accent = "#2563EB";

  // Helper function to get option text by ID
  const getOptionText = (question: Question, optionId: number): string => {
    const option = question.options?.find((opt) => opt.id === optionId);
    return (option as any)?.content || option?.optionText || "";
  };

  // Helper function to render user's answer
  const renderUserAnswer = (answer: any, question: Question) => {
    const questionType = question.type;

    if (questionType === "multiple_choice" || questionType === "true_false") {
      const selectedIds = answer.selectedOptions || [];
      return (
        <View className="gap-2">
          {selectedIds.map((id: number) => (
            <View
              key={id}
              className="bg-blue-50 border border-blue-200 rounded-xl p-3"
            >
              <Text className="text-blue-800 text-base">
                {getOptionText(question, id)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    if (questionType === "fill_in_the_blank") {
      const textAnswer =
        typeof answer.textAnswer === "string"
          ? answer.textAnswer
          : JSON.stringify(answer.textAnswer);
      return (
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <Text className="text-blue-800 text-base">{textAnswer}</Text>
        </View>
      );
    }

    if (questionType === "matching") {
      const matches = answer.matchingAnswers || {};
      return (
        <View className="gap-3">
          {Object.entries(matches).map(([leftId, rightId], idx) => (
            <View
              key={`${leftId}-${rightId}-${idx}`}
              className="flex-row gap-2 items-stretch"
            >
              <View className="flex-1 bg-white border border-blue-200 rounded-lg p-3">
                <Text className="text-[11px] font-semibold text-gray-500 mb-1">
                  Esquerda
                </Text>
                <Text className="text-sm text-gray-900">{leftId}</Text>
              </View>
              <View className="w-10 items-center justify-center">
                <View className="h-full w-px bg-gray-200" />
              </View>
              <View className="flex-1 bg-white border border-blue-200 rounded-lg p-3">
                <Text className="text-[11px] font-semibold text-gray-500 mb-1">
                  Direita
                </Text>
                <Text className="text-sm text-gray-900">{rightId}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    }

    return (
      <Text className="text-gray-600 italic">Resposta não disponível</Text>
    );
  };

  // Helper function to render correct answer
  const renderCorrectAnswer = (answer: any, question: Question) => {
    const correctAnswerData = answer.correctAnswer;

    if (!correctAnswerData) {
      return (
        <Text className="text-gray-600 italic">
          Resposta correta não disponível
        </Text>
      );
    }

    const questionType = question.type;

    if (questionType === "multiple_choice" || questionType === "true_false") {
      // correctAnswer should contain the correct option IDs
      const correctIds = Array.isArray(correctAnswerData)
        ? correctAnswerData
        : [correctAnswerData];
      return (
        <View className="gap-2">
          {correctIds.map((id: number) => (
            <View
              key={id}
              className="bg-green-50 border border-green-200 rounded-xl p-3"
            >
              <Text className="text-green-800 text-base">
                {getOptionText(question, id)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    if (questionType === "fill_in_the_blank") {
      return (
        <View className="bg-green-50 border border-green-200 rounded-xl p-3">
          <Text className="text-green-800 text-base">
            {typeof correctAnswerData === "string"
              ? correctAnswerData
              : JSON.stringify(correctAnswerData)}
          </Text>
        </View>
      );
    }

    if (questionType === "matching") {
      const correctMatches = correctAnswerData || {};
      return (
        <View className="gap-3">
          {Object.entries(correctMatches).map(([leftId, rightId], idx) => (
            <View
              key={`${leftId}-${rightId}-${idx}`}
              className="flex-row gap-2 items-stretch"
            >
              <View className="flex-1 bg-white border border-green-200 rounded-lg p-3">
                <Text className="text-[11px] font-semibold text-gray-500 mb-1">
                  Esquerda
                </Text>
                <Text className="text-sm text-gray-900">{leftId}</Text>
              </View>
              <View className="w-10 items-center justify-center">
                <View className="h-full w-px bg-gray-200" />
              </View>
              <View className="flex-1 bg-white border border-green-200 rounded-lg p-3">
                <Text className="text-[11px] font-semibold text-gray-500 mb-1">
                  Direita
                </Text>
                <Text className="text-sm text-gray-900">{rightId}</Text>
              </View>
            </View>
          ))}
        </View>
      );
    }

    return (
      <Text className="text-gray-600 italic">
        Resposta correta não disponível
      </Text>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <ChevronLeft size={24} color="#6B7280" strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Revisão do Quiz
            </Text>
            <Text className="text-sm text-gray-600">
              {results.correctCount} de {answers.length} corretas
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Questions Review */}
      {answers.map((answer, index) => {
        const question = answer.question;
        if (!question) return null;

          return (
            <Animated.View
              key={answer.id}
              entering={FadeIn.duration(400).delay(index * 100)}
              className="mb-4"
            >
              <View className="bg-white rounded-3xl p-6 shadow-sm">
                {/* Question Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        answer.isCorrect
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {answer.isCorrect ? (
                        <CheckCircle2
                          size={24}
                          color="#10B981"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <XCircle size={24} color="#EF4444" strokeWidth={2.5} />
                      )}
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-gray-900">
                        Questão {index + 1}
                      </Text>
                      <Text
                        className={`text-xs font-semibold ${
                          answer.isCorrect ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {answer.isCorrect ? "Correta" : "Incorreta"}
                      </Text>
                    </View>
                  </View>

                  {/* Points Badge */}
                  <View className="flex-row items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                    <Image
                      source={require("@/assets/ribbon.png")}
                      style={{ width: 18, height: 18 }}
                      resizeMode="contain"
                    />
                    <Text className="text-sm font-semibold text-gray-800">
                      {answer.earnedPoints} pts
                    </Text>
                  </View>
                </View>

                {/* Question Text */}
                <Text className="text-[17px] text-gray-900 font-semibold mb-4 leading-relaxed">
                  {question.prompt || question.questionText}
                </Text>

                {/* User's Answer */}
                <View className="mb-4">
                  <Text className="text-sm font-bold text-gray-700 mb-2">
                    Sua Resposta
                  </Text>
                  {renderUserAnswer(answer, question)}
                </View>

                {/* Correct Answer (if wrong and showCorrectAnswers is true) */}
                {!answer.isCorrect && showCorrectAnswers && (
                  <View>
                    <Text className="text-sm font-bold text-gray-700 mb-2">
                      Resposta Correta
                    </Text>
                    {renderCorrectAnswer(answer, question)}
                  </View>
                )}

                {/* Explanation (if available) */}
                {question.explanation && (
                  <View className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <Text className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wide">
                      Explicação
                    </Text>
                    <Text className="text-sm text-blue-900 leading-relaxed">
                      {question.explanation}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}

        {/* Summary at Bottom */}
        <View className="bg-white border border-gray-200 rounded-3xl p-6 mt-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4 text-center">
            Resumo
          </Text>
          <View className="flex-row justify-between gap-3">
            <SummaryChip label="Corretas" value={results.correctCount} accent={accent} />
            <SummaryChip label="Incorretas" value={results.incorrectCount} accent="#EF4444" />
            <SummaryChip label="Pontuação" value={`${results.score}%`} accent={accent} />
          </View>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={onClose}
          className="bg-white border border-gray-300 rounded-full py-4 mt-4 items-center shadow-sm"
        >
          <Text className="text-gray-900 text-base font-semibold">
            Fechar Revisão
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ----------------
// Summary chip
// ----------------
type SummaryChipProps = {
  label: string;
  value: string | number;
  accent: string;
};

function SummaryChip({ label, value, accent }: SummaryChipProps) {
  return (
    <View className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 items-center">
      <Text className="text-xs font-semibold text-gray-600 mb-1">{label}</Text>
      <Text className="text-xl font-bold" style={{ color: accent }}>
        {value}
      </Text>
    </View>
  );
}
