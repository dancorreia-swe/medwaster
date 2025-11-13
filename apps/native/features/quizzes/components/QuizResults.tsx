import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react-native";
import type { QuizResultsProps } from "../types";

/**
 * Quiz Results Component
 * Displays comprehensive results after quiz completion
 */
export function QuizResults({
  results,
  onContinue,
  onReview,
  showReviewButton = false,
}: QuizResultsProps) {
  const { score, earnedPoints, totalPoints, correctCount, incorrectCount, passed, timeSpentSeconds } = results;

  const totalQuestions = correctCount + incorrectCount;
  const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // Format time spent
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Result Header */}
      <View
        className={`rounded-2xl p-8 mb-6 items-center ${
          passed
            ? "bg-gradient-to-br from-green-500 to-green-600"
            : "bg-gradient-to-br from-orange-500 to-orange-600"
        }`}
        style={{
          backgroundColor: passed ? "#10B981" : "#F97316",
        }}
      >
        {/* Icon */}
        <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-4">
          {passed ? (
            <CheckCircle2 size={56} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <TrendingUp size={56} color="#FFFFFF" strokeWidth={2.5} />
          )}
        </View>

        {/* Status */}
        <Text className="text-3xl font-bold text-white mb-2">
          {passed ? "Parabéns!" : "Quase lá!"}
        </Text>
        <Text className="text-lg text-white/90 text-center">
          {passed
            ? "Você passou no quiz!"
            : "Continue praticando para melhorar"}
        </Text>

        {/* Score */}
        <View className="mt-6 bg-white/20 rounded-xl px-6 py-3">
          <Text className="text-white/80 text-sm text-center mb-1">
            Pontuação Final
          </Text>
          <Text className="text-5xl font-bold text-white text-center">
            {score}%
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
        <Text className="text-lg font-bold text-gray-900 mb-4">
          Estatísticas
        </Text>

        <View className="gap-4">
          {/* Accuracy */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                <Target size={20} color="#155DFC" strokeWidth={2.5} />
              </View>
              <Text className="text-base text-gray-700">Precisão</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {accuracy.toFixed(1)}%
            </Text>
          </View>

          {/* Correct Answers */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
                <CheckCircle2 size={20} color="#10B981" strokeWidth={2.5} />
              </View>
              <Text className="text-base text-gray-700">Respostas Corretas</Text>
            </View>
            <Text className="text-xl font-bold text-green-600">
              {correctCount} / {totalQuestions}
            </Text>
          </View>

          {/* Incorrect Answers */}
          {incorrectCount > 0 && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
                  <XCircle size={20} color="#EF4444" strokeWidth={2.5} />
                </View>
                <Text className="text-base text-gray-700">Respostas Incorretas</Text>
              </View>
              <Text className="text-xl font-bold text-red-600">
                {incorrectCount}
              </Text>
            </View>
          )}

          {/* Points Earned */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center">
                <Award size={20} color="#F59E0B" strokeWidth={2.5} />
              </View>
              <Text className="text-base text-gray-700">Pontos Ganhos</Text>
            </View>
            <Text className="text-xl font-bold text-yellow-600">
              {earnedPoints} / {totalPoints}
            </Text>
          </View>

          {/* Time Spent */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
                <Clock size={20} color="#7C3AED" strokeWidth={2.5} />
              </View>
              <Text className="text-base text-gray-700">Tempo Gasto</Text>
            </View>
            <Text className="text-xl font-bold text-purple-600">
              {formatTime(timeSpentSeconds)}
            </Text>
          </View>
        </View>
      </View>

      {/* Passing Status */}
      <View
        className={`rounded-xl p-5 mb-6 border-2 ${
          passed
            ? "bg-green-50 border-green-300"
            : "bg-orange-50 border-orange-300"
        }`}
      >
        <Text
          className={`text-sm font-semibold mb-1 ${
            passed ? "text-green-700" : "text-orange-700"
          }`}
        >
          Status
        </Text>
        <Text
          className={`text-base ${
            passed ? "text-green-900" : "text-orange-900"
          }`}
        >
          {passed
            ? `✓ Aprovado! Você atingiu a pontuação mínima.`
            : `Você precisa de ${results.attempt.quiz?.passingScore || 70}% para passar. Tente novamente!`}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="gap-3">
        {/* Review Answers Button (optional) */}
        {showReviewButton && onReview && (
          <TouchableOpacity
            onPress={onReview}
            className="bg-white border-2 border-primary rounded-full py-4 items-center"
          >
            <Text className="text-primary text-base font-semibold">
              Revisar Respostas
            </Text>
          </TouchableOpacity>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          onPress={onContinue}
          className={`rounded-full py-4 items-center ${
            passed ? "bg-green-600" : "bg-primary"
          }`}
        >
          <Text className="text-white text-base font-semibold">
            {passed ? "Continuar" : "Tentar Novamente"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
