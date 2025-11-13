import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import type { QuizAttemptProps, QuizAttemptProgress } from "../types";
import type { QuestionAnswer } from "../../questions/types";
import { QuestionRenderer } from "../../questions/components";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuizTimer } from "./QuizTimer";

/**
 * Quiz Attempt Component
 * Full quiz taking experience with question navigation
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort questions by sequence
  const sortedQuestions = [...(quiz.questions || [])].sort(
    (a, b) => a.sequence - b.sequence
  );

  const currentQuestion = sortedQuestions[progress.currentQuestionIndex];
  const isLastQuestion =
    progress.currentQuestionIndex === sortedQuestions.length - 1;
  const isFirstQuestion = progress.currentQuestionIndex === 0;

  // Check if current question has been answered
  const currentAnswer = progress.answers.get(currentQuestion?.id);
  const hasAnsweredCurrent = currentAnswer !== undefined;

  // Count answered questions
  const answeredCount = progress.answers.size;

  const handleAnswerSubmit = (answer: QuestionAnswer) => {
    if (!currentQuestion) return;

    setProgress((prev) => {
      const newAnswers = new Map(prev.answers);
      newAnswers.set(currentQuestion.id, answer);
      return { ...prev, answers: newAnswers };
    });
  };

  const handleNext = () => {
    if (progress.currentQuestionIndex < sortedQuestions.length - 1) {
      setProgress((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  };

  const handlePrevious = () => {
    if (progress.currentQuestionIndex > 0) {
      setProgress((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  const handleGoToQuestion = (index: number) => {
    setProgress((prev) => ({
      ...prev,
      currentQuestionIndex: index,
    }));
  };

  const handleSubmitQuiz = useCallback(async () => {
    // Check if all questions are answered
    if (answeredCount < sortedQuestions.length) {
      Alert.alert(
        "Quiz Incompleto",
        `Você respondeu ${answeredCount} de ${sortedQuestions.length} questões. Deseja submeter mesmo assim?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Submeter", onPress: () => submitQuiz(), style: "destructive" },
        ]
      );
      return;
    }

    submitQuiz();
  }, [answeredCount, sortedQuestions.length]);

  const submitQuiz = async () => {
    setIsSubmitting(true);

    try {
      // Format answers for API
      const answersArray = sortedQuestions.map((quizQuestion) => {
        const answer = progress.answers.get(quizQuestion.id);

        // Determine answer format based on question type
        const questionType = quizQuestion.question.type;

        if (questionType === "multiple_choice" || questionType === "true_false") {
          return {
            quizQuestionId: quizQuestion.id,
            selectedOptions: Array.isArray(answer) ? answer : [answer as number],
            timeSpent: 0, // TODO: Track per-question time
          };
        }

        if (questionType === "fill_in_the_blank") {
          return {
            quizQuestionId: quizQuestion.id,
            textAnswer: typeof answer === "string" ? answer : JSON.stringify(answer),
            timeSpent: 0,
          };
        }

        if (questionType === "matching") {
          return {
            quizQuestionId: quizQuestion.id,
            matchingAnswers: answer as Record<string, string>,
            timeSpent: 0,
          };
        }

        // Fallback
        return {
          quizQuestionId: quizQuestion.id,
          selectedOptions: [],
          timeSpent: 0,
        };
      });

      // Calculate time spent
      const timeSpentSeconds = Math.floor(
        (Date.now() - progress.startTime.getTime()) / 1000
      );

      // Call parent's completion handler with formatted data
      // The parent will handle the actual API call
      const results = {
        attemptId,
        answers: answersArray,
        timeSpent: timeSpentSeconds,
      };

      onComplete(results as any);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      Alert.alert(
        "Erro",
        "Não foi possível enviar o quiz. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    Alert.alert(
      "Tempo Esgotado",
      "O tempo para completar este quiz acabou. Suas respostas serão enviadas automaticamente.",
      [{ text: "OK", onPress: () => submitQuiz() }],
      { cancelable: false }
    );
  }, []);

  const handleExit = () => {
    Alert.alert(
      "Sair do Quiz",
      "Você tem certeza que deseja sair? Seu progresso será perdido.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: onExit, style: "destructive" },
      ]
    );
  };

  if (!currentQuestion) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-600 text-center">
          Nenhuma questão encontrada
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* Timer (if time limit set) */}
        {quiz.timeLimit && (
          <QuizTimer
            timeLimit={quiz.timeLimit}
            startTime={progress.startTime}
            onTimeUp={handleTimeUp}
          />
        )}

        {/* Progress Bar */}
        <QuizProgressBar
          currentQuestion={progress.currentQuestionIndex + 1}
          totalQuestions={sortedQuestions.length}
          answeredQuestions={answeredCount}
        />

        {/* Question Points */}
        <View className="bg-blue-50 rounded-xl p-3 mb-4 flex-row items-center justify-between">
          <Text className="text-sm text-blue-700">
            Pontos desta questão:
          </Text>
          <Text className="text-lg font-bold text-blue-700">
            {currentQuestion.points}
          </Text>
        </View>

        {/* Question Renderer */}
        <QuestionRenderer
          question={currentQuestion.question}
          onSubmit={handleAnswerSubmit}
          isSubmitting={false}
          disabled={false}
        />

        {/* Answer Status */}
        {hasAnsweredCurrent && (
          <View className="bg-green-50 border border-green-200 rounded-xl p-3 mt-4 flex-row items-center gap-2">
            <CheckCircle size={18} color="#10B981" strokeWidth={2.5} />
            <Text className="text-sm text-green-700 font-medium">
              Resposta salva! Você pode alterá-la antes de finalizar.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation Footer */}
      <View className="border-t border-gray-200 bg-white p-4">
        {/* Question Navigation Dots */}
        <View className="flex-row flex-wrap gap-2 mb-4 justify-center">
          {sortedQuestions.map((q, index) => {
            const isAnswered = progress.answers.has(q.id);
            const isCurrent = index === progress.currentQuestionIndex;

            return (
              <TouchableOpacity
                key={q.id}
                onPress={() => handleGoToQuestion(index)}
                className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                  isCurrent
                    ? "bg-primary border-primary"
                    : isAnswered
                      ? "bg-green-100 border-green-500"
                      : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isCurrent
                      ? "text-white"
                      : isAnswered
                        ? "text-green-700"
                        : "text-gray-500"
                  }`}
                >
                  {index + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Navigation Buttons */}
        <View className="flex-row gap-3">
          {/* Previous Button */}
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={isFirstQuestion}
            className={`flex-1 rounded-full py-3 flex-row items-center justify-center gap-2 border border-gray-300 ${
              isFirstQuestion ? "opacity-50" : ""
            }`}
          >
            <ChevronLeft size={20} color="#364153" strokeWidth={2.5} />
            <Text className="text-gray-900 font-semibold">Anterior</Text>
          </TouchableOpacity>

          {/* Next/Submit Button */}
          {isLastQuestion ? (
            <TouchableOpacity
              onPress={handleSubmitQuiz}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 rounded-full py-3 flex-row items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle size={20} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white font-semibold">Finalizar</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              className="flex-1 bg-primary rounded-full py-3 flex-row items-center justify-center gap-2"
            >
              <Text className="text-white font-semibold">Próxima</Text>
              <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Exit Button */}
        {onExit && (
          <TouchableOpacity
            onPress={handleExit}
            className="mt-3 py-2 items-center"
          >
            <Text className="text-gray-500 text-sm">Sair do Quiz</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
