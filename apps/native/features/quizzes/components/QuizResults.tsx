import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { useEffect, useRef, useState } from "react";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import type { QuizResultsProps } from "../types";

// Create a component that can be animated with text prop
Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/**
 * Quiz Results Component - Duolingo-style clean design
 * Displays results after quiz completion with minimal, focused UI
 */
export function QuizResults({
  results,
  onContinue,
  onReview,
  showReviewButton = false,
}: QuizResultsProps) {
  const { score, earnedPoints, totalPoints, correctCount, incorrectCount, passed, timeSpentSeconds } = results;
  const confettiRef = useRef<any>(null);

  // Animated score counter
  const animatedScore = useSharedValue(0);

  // Trigger animations on mount
  useEffect(() => {
    // Animate score from 0 to final value with slower, smoother easing
    animatedScore.value = withTiming(score, {
      duration: 3500,
      easing: Easing.inOut(Easing.cubic),
    });

    // Trigger confetti if passed
    if (passed && confettiRef.current) {
      setTimeout(() => {
        confettiRef.current?.start();
      }, 3000); // Delay to sync with score animation
    }
  }, [passed, score]);

  const totalQuestions = correctCount + incorrectCount;
  const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // Animated props for score text
  const animatedProps = useAnimatedProps(() => {
    return {
      text: `${Math.round(animatedScore.value)}%`,
    };
  });

  // Format time spent
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40, paddingBottom: 120 }}
      >
        {/* Result Header - Clean and Minimal */}
        <View
          className="rounded-3xl p-10 mb-6 items-center"
          style={{
            backgroundColor: passed ? "#10B981" : "#F97316",
          }}
        >
          {/* Icon */}
          <View className="w-24 h-24 rounded-full bg-white/30 items-center justify-center mb-6">
            {passed ? (
              <Award size={48} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <TrendingUp size={48} color="#FFFFFF" strokeWidth={2.5} />
            )}
          </View>

          {/* Status */}
          <Text className="text-3xl font-bold text-white mb-2">
            {passed ? "🎉 Parabéns!" : "💪 Quase lá!"}
          </Text>
          <Text className="text-base text-white/90 text-center">
            {passed ? "Você arrasou neste quiz!" : "Continue praticando para melhorar"}
          </Text>

          {/* Score */}
          <View className="mt-8 bg-white/20 rounded-2xl px-12 py-6">
            <Text className="text-white/80 text-xs text-center mb-1 font-medium tracking-wide">
              Pontuação Final
            </Text>
            <View style={{ minWidth: 200, height: 85, justifyContent: 'center', alignItems: 'center' }}>
              <AnimatedTextInput
                animatedProps={animatedProps}
                editable={false}
                style={{
                  fontSize: 70,
                  fontWeight: '900',
                  color: 'white',
                  textAlign: 'center',
                  padding: 0,
                  margin: 0,
                  minWidth: 200,
                }}
                defaultValue="0%"
              />
            </View>
          </View>
        </View>

        {/* Stats Section - Clean List */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Estatísticas
          </Text>

          <View className="bg-white rounded-2xl border border-gray-200">
            {/* Accuracy */}
            <View className="flex-row items-center justify-between p-5 border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-full bg-blue-50 items-center justify-center">
                  <Target size={22} color="#3B82F6" strokeWidth={2.5} />
                </View>
                <Text className="text-base text-gray-700 font-medium">Precisão</Text>
              </View>
              <Text className="text-xl font-bold text-gray-900">
                {accuracy.toFixed(1)}%
              </Text>
            </View>

            {/* Correct Answers */}
            <View className="flex-row items-center justify-between p-5 border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-full bg-green-50 items-center justify-center">
                  <CheckCircle2 size={22} color="#10B981" strokeWidth={2.5} />
                </View>
                <Text className="text-base text-gray-700 font-medium">Respostas Corretas</Text>
              </View>
              <Text className="text-xl font-bold text-green-600">
                {correctCount} / {totalQuestions}
              </Text>
            </View>

            {/* Incorrect Answers */}
            <View className="flex-row items-center justify-between p-5 border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-full bg-red-50 items-center justify-center">
                  <XCircle size={22} color="#EF4444" strokeWidth={2.5} />
                </View>
                <Text className="text-base text-gray-700 font-medium">Respostas Incorretas</Text>
              </View>
              <Text className="text-xl font-bold text-red-600">
                {incorrectCount}
              </Text>
            </View>

            {/* Time Spent */}
            <View className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-full bg-purple-50 items-center justify-center">
                  <Clock size={22} color="#A855F7" strokeWidth={2.5} />
                </View>
                <Text className="text-base text-gray-700 font-medium">Tempo Gasto</Text>
              </View>
              <Text className="text-xl font-bold text-purple-600">
                {formatTime(timeSpentSeconds)}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Section */}
        <View
          className={`rounded-2xl p-5 mb-6 border-2 ${
            passed
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <Text
            className={`text-sm font-bold mb-1 uppercase tracking-wide ${
              passed ? "text-green-700" : "text-red-700"
            }`}
          >
            Status
          </Text>
          <Text
            className={`text-base leading-relaxed ${
              passed ? "text-green-900" : "text-red-900"
            }`}
          >
            {passed
              ? `Você atingiu a pontuação mínima.`
              : `Você precisa de ${results.attempt.quiz?.passingScore || 70}% para passar. Tente novamente!`}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          {/* Continue Button */}
          <TouchableOpacity
            onPress={onContinue}
            className={`rounded-2xl py-5 items-center ${
              passed ? "bg-green-500" : "bg-blue-500"
            }`}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">
              {passed ? "Continuar" : "Tentar Novamente"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confetti - Positioned at the end to be on top */}
      {passed && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, pointerEvents: 'none' }}>
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{ x: -10, y: 0 }}
            autoStart={false}
            fadeOut={true}
            explosionSpeed={350}
            fallSpeed={2500}
          />
        </View>
      )}
    </View>
  );
}
