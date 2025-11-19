import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { X, CheckCircle2, XCircle } from "lucide-react-native";
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import type { QuizAttemptProps, QuizAttemptProgress } from "../types";
import type { QuestionAnswer } from "../../questions/types";
import { QuestionRenderer } from "../../questions/components";
import { QuizTimer } from "./QuizTimer";

type FeedbackState = "none" | "correct" | "incorrect";

/**
 * Quiz Attempt Component - Duolingo-style linear flow with immediate feedback
 * Full quiz taking experience with one question at a time and clear feedback
 */
export function QuizAttempt({
  quiz,
  attemptId,
  onComplete,
  onExit,
}: QuizAttemptProps) {
  const [progress, setProgress] = useState<QuizAttemptProgress>({
    attemptId,
    currentQuestionIndex: 0,
    totalQuestions: quiz.questions?.length || 0,
    answers: new Map(),
    timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : null,
    startTime: new Date(),
  });

  const [currentAnswer, setCurrentAnswer] = useState<QuestionAnswer | null>(
    null,
  );
  const [feedback, setFeedback] = useState<FeedbackState>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort questions by sequence
  const sortedQuestions = [...(quiz.questions || [])].sort(
    (a, b) => a.sequence - b.sequence,
  );

  const currentQuestion = sortedQuestions[progress.currentQuestionIndex];
  const isLastQuestion =
    progress.currentQuestionIndex === sortedQuestions.length - 1;

  // Count answered questions
  const answeredCount = progress.answers.size;

  const handleAnswerSubmit = (answer: QuestionAnswer) => {
    setCurrentAnswer(answer);
  };

  const handleCheckAnswer = () => {
    if (!currentAnswer || !currentQuestion) return;

    // Store the answer
    setProgress((prev) => {
      const newAnswers = new Map(prev.answers);
      newAnswers.set(currentQuestion.id, currentAnswer);
      return { ...prev, answers: newAnswers };
    });

    // Check if answer is correct
    const isCorrect = checkAnswerCorrectness(currentAnswer);
    setFeedback(isCorrect ? "correct" : "incorrect");
  };

  const checkAnswerCorrectness = (answer: QuestionAnswer): boolean => {
    if (!currentQuestion) return false;

    const questionType = currentQuestion.question.type;

    // Multiple Choice or True/False
    if (questionType === "multiple_choice" || questionType === "true_false") {
      const selectedOptions = Array.isArray(answer)
        ? answer
        : [answer as number];
      const correctOptions =
        currentQuestion.question.options
          ?.filter((opt) => opt.isCorrect)
          .map((opt) => opt.id) || [];

      if (selectedOptions.length !== correctOptions.length) return false;
      return selectedOptions.every((id) => correctOptions.includes(id));
    }

    // Fill in the Blank
    if (questionType === "fill_in_the_blank") {
      const userAnswers = answer as Record<string, string>;
      return (
        currentQuestion.question.fillInBlanks?.every((blank) => {
          const userAnswer = userAnswers[blank.id.toString()]
            ?.toLowerCase()
            .trim();
          
          // Find the correct option
          const correctOption = blank.options?.find((opt) => opt.isCorrect);
          if (!correctOption) return false;
          
          return userAnswer === correctOption.text.toLowerCase().trim();
        }) || false
      );
    }

    // Matching
    if (questionType === "matching") {
      const userMatches = answer as Record<string, string>;
      return (
        currentQuestion.question.matchingPairs?.every((pair) => {
          // Accept either ID keys or leftText keys; map to rightText
          const userRight =
            userMatches[pair.id.toString()] ??
            userMatches[pair.leftText] ??
            userMatches[pair.leftText.trim()] ??
            userMatches[pair.leftText.toLowerCase()];
          return userRight === pair.rightText;
        }) || false
      );
    }

    return false;
  };

  const handleContinue = () => {
    if (feedback === "none") {
      // Check answer first
      handleCheckAnswer();
      return;
    }

    // Move to next question
    if (progress.currentQuestionIndex < sortedQuestions.length - 1) {
      setProgress((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setCurrentAnswer(null);
      setFeedback("none");
    } else {
      // Submit quiz
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);

    try {
      // Format answers for API
      const answersArray = sortedQuestions.map((quizQuestion) => {
        const answer = progress.answers.get(quizQuestion.id);

        // Determine answer format based on question type
        const questionType = quizQuestion.question.type;

        if (
          questionType === "multiple_choice" ||
          questionType === "true_false"
        ) {
          return {
            quizQuestionId: quizQuestion.id,
            selectedOptions: Array.isArray(answer)
              ? answer
              : [answer as number],
            timeSpent: 0,
          };
        }

        if (questionType === "fill_in_the_blank") {
          return {
            quizQuestionId: quizQuestion.id,
            textAnswer:
              typeof answer === "string" ? answer : JSON.stringify(answer),
            timeSpent: 0,
          };
        }

        if (questionType === "matching") {
          // Normalize to backend format: leftText -> rightText
          const pairs = quizQuestion.question.matchingPairs || [];
          const userMatches = (answer || {}) as Record<string, string>;
          const normalized: Record<string, string> = {};
          pairs.forEach((pair) => {
            const userRight =
              userMatches[pair.id.toString()] ??
              userMatches[pair.leftText] ??
              userMatches[pair.leftText.trim()] ??
              userMatches[pair.leftText.toLowerCase()];
            if (userRight) {
              normalized[pair.leftText] = userRight;
            }
          });

          return {
            quizQuestionId: quizQuestion.id,
            matchingAnswers: normalized,
            timeSpent: 0,
          };
        }

        return {
          quizQuestionId: quizQuestion.id,
          selectedOptions: [],
          timeSpent: 0,
        };
      });

      // Calculate time spent
      const timeSpentSeconds = Math.floor(
        (Date.now() - progress.startTime.getTime()) / 1000,
      );

      const results = {
        attemptId,
        answers: answersArray,
        timeSpent: timeSpentSeconds,
      };

      onComplete(results as any);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      Alert.alert("Erro", "Não foi possível enviar o quiz. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    Alert.alert(
      "Tempo Esgotado",
      "O tempo para completar este quiz acabou. Suas respostas serão enviadas automaticamente.",
      [{ text: "OK", onPress: () => submitQuiz() }],
      { cancelable: false },
    );
  }, []);

  const handleExit = () => {
    Alert.alert(
      "Sair do Quiz",
      "Você tem certeza que deseja sair? Seu progresso será perdido.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: onExit, style: "destructive" },
      ],
    );
  };

  if (!currentQuestion) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-gray-50">
        <Text className="text-gray-600 text-center">
          Nenhuma questão encontrada
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-12 pb-3 px-4">
        <View className="flex-row items-center mb-4">
          {/* Close Button */}
          <TouchableOpacity
            onPress={handleExit}
            className="mr-4"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={28} color="#6B7280" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Segmented Progress Bar */}
          <View className="flex-1 flex-row items-center" style={{ gap: 4 }}>
            {Array.from({ length: sortedQuestions.length }).map((_, index) => {
              const isFilled = index < progress.currentQuestionIndex + 1;
              const isActive = index === progress.currentQuestionIndex;

              return (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    height: 6,
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

          {/* Question Counter */}
          <Text className="text-xs font-semibold text-gray-600 ml-3 min-w-[35px] text-right">
            {progress.currentQuestionIndex + 1}/{sortedQuestions.length}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 32,
          paddingBottom: 120,
        }}
      >
        {/* Question */}
        <Animated.View
          key={progress.currentQuestionIndex}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(300)}
        >
          <QuestionRenderer
            question={currentQuestion.question}
            onSubmit={handleAnswerSubmit}
            isSubmitting={false}
            disabled={feedback !== "none"}
            textSize="md"
          />
        </Animated.View>
      </ScrollView>

      {/* Feedback Section - Fixed at bottom above button */}
      {feedback !== "none" && (
        <View className="px-5 pb-3">
          <Animated.View entering={FadeIn.duration(300)}>
            <View className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
              <View className="flex-row items-center gap-3 mb-3">
                {feedback === "correct" ? (
                  <CheckCircle2 size={24} color="#16A34A" strokeWidth={2.5} />
                ) : (
                  <XCircle size={24} color="#EF4444" strokeWidth={2.5} />
                )}
                <Text
                  className={`text-lg font-bold ${
                    feedback === "correct" ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {feedback === "correct" ? "Correto!" : "Incorreto"}
                </Text>
              </View>

              {currentQuestion.question.explanation && (
                <Text className="text-base leading-relaxed text-gray-900">
                  {currentQuestion.question.explanation}
                </Text>
              )}

              {currentQuestion.question.correctAnswer &&
                currentQuestion.question.correctAnswer !== undefined &&
                quiz.showCorrectAnswers && (
                  <View className="mt-3">
                    <Text className="text-xs font-semibold text-gray-600 tracking-wide mb-1">
                      Resposta correta
                    </Text>
                    <Text className="text-sm text-gray-900 leading-relaxed">
                      {formatInlineCorrect(
                        currentQuestion.question.correctAnswer,
                        currentQuestion.question,
                      )}
                    </Text>
                  </View>
                )}
            </View>
          </Animated.View>
        </View>
      )}

      {/* Bottom Action Button */}
      <View className="bg-white border-t border-gray-200 px-5 py-4 pb-8">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!currentAnswer || isSubmitting}
          className={`rounded-2xl py-5 ${
            !currentAnswer || isSubmitting
              ? "bg-gray-300"
              : feedback === "correct"
                ? "bg-green-500"
                : feedback === "incorrect"
                  ? "bg-red-500"
                  : "bg-blue-500"
          }`}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="white" className="mr-2" />
              <Text className="text-white text-lg font-bold">
                Finalizando...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-lg font-bold text-center">
              {feedback === "none"
                ? "Verificar"
                : isLastQuestion
                  ? "Ver Resultados"
                  : "Continuar"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
