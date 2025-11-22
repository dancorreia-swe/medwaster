import { Container } from "@/components/container";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import {
  useTrailContent,
  useSubmitTrailQuestion,
  useMarkTrailArticleRead,
  useStartTrailQuiz,
  useSubmitTrailQuiz,
  useTrail,
  useTrailProgress,
} from "@/features/trails/hooks";
import { useState, useEffect, useRef } from "react";
import {
  QuestionRenderer,
  QuestionResult as QuestionResultComponent,
} from "@/features/questions/components";
import {
  QuizAttempt as QuizAttemptComponent,
  QuizResults as QuizResultsComponent,
} from "@/features/quizzes/components";
import type {
  QuestionAnswer,
  QuestionResult as QuestionResultType,
} from "@/features/questions/types";
import type { QuizResults as QuizResultsType } from "@/features/quizzes/types";
import { normalizeMatchingAnswer } from "@/features/questions/utils";

export default function TrailContentScreen() {
  const params = useLocalSearchParams<{ id: string; contentId: string }>();
  const { id, contentId } = params;
  const trailId = Number(id);
  const contentItemId = Number(contentId);

  const router = useRouter();
  const { data: content, isLoading } = useTrailContent(trailId);
  const { data: trail } = useTrail(trailId);
  const { data: trailProgress } = useTrailProgress(trailId);
  const submitQuestionMutation = useSubmitTrailQuestion();
  const markArticleReadMutation = useMarkTrailArticleRead();
  const startQuizMutation = useStartTrailQuiz();
  const submitQuizMutation = useSubmitTrailQuiz();

  // Question state
  const [showQuestionResult, setShowQuestionResult] = useState(false);
  const [questionResult, setQuestionResult] =
    useState<QuestionResultType | null>(null);
  const [currentQuestionAnswer, setCurrentQuestionAnswer] =
    useState<QuestionAnswer | null>(null);

  // Quiz state
  const [quizAttemptId, setQuizAttemptId] = useState<number | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResultsType | null>(null);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);

  // Trail completion state
  const [completionData, setCompletionData] = useState<any>(null);

  // Track if quiz has been started to prevent multiple calls
  const quizStartedRef = useRef(false);

  // Find the specific content item
  const contentItem = content?.find((item: any) => item.id === contentItemId);

  // ============================================================================
  // Helper Functions - Define before early returns
  // ============================================================================

  /**
   * Get current answer
   */
  const getCurrentAnswer = () => {
    return currentQuestionAnswer;
  };

  /**
   * Check if user has answered current question
   */
  const hasCurrentAnswer = () => {
    return currentQuestionAnswer !== null;
  };

  // ============================================================================
  // Handlers - Define before early returns
  // ============================================================================

  /**
   * Handle question answer change (store locally without submitting)
   */
  const handleQuestionAnswerChange = (answer: QuestionAnswer) => {
    console.log("[ContentScreen] Answer changed:", answer);
    setCurrentQuestionAnswer(answer);
  };

  /**
   * Handle question answer submission
   */
  const handleSubmitQuestion = async (answer: QuestionAnswer) => {
    if (!contentItem?.question) return;

    try {
      const question = contentItem.question;
      let formattedAnswer: QuestionAnswer = answer;

      if (question.type === "matching") {
        formattedAnswer = normalizeMatchingAnswer(
          answer as Record<string, string>,
          question.matchingPairs,
        );
      }

      const response = await submitQuestionMutation.mutateAsync({
        trailId,
        questionId: contentItem.question.id,
        data: {
          answer: formattedAnswer as any,
          timeSpentSeconds: 0, // TODO: Track actual time
        },
      });

      // Check if trail was just completed
      if (response.trailJustCompleted && response.progress) {
        setCompletionData(response.progress);
      }

      // Normalize response to match our types
      const normalizedResult: QuestionResultType = {
        isCorrect: response.isCorrect,
        correctAnswer: response.correctAnswer,
        explanation: response.explanation || undefined,
        score: response.score,
        userAnswer: formattedAnswer,
      };

      setQuestionResult(normalizedResult);
      setShowQuestionResult(true);
    } catch (error) {
      console.error("Failed to submit question:", error);
    }
  };

  /**
   * Handle question result continue button
   */
  const handleQuestionContinue = () => {
    // If trail was just completed, navigate to celebration
    if (completionData && trail) {
      // Parse completedContentIds if it's a string
      const completedIds =
        typeof completionData.completedContentIds === "string"
          ? JSON.parse(completionData.completedContentIds || "[]")
          : completionData.completedContentIds || [];

      router.push({
        pathname: "/(app)/trails/celebration",
        params: {
          trailName: trail.name,
          difficulty: trail.difficulty,
          score: String(completionData.currentScore || 0),
          isPassed: String(completionData.isPassed || false),
          timeSpentMinutes: String(completionData.timeSpentMinutes || 0),
          completedContent: String(completedIds.length),
          totalContent: String(trail.content?.length || 0),
        },
      } as any);
    } else {
      router.back();
    }
  };

  /**
   * Handle start quiz
   */
  const handleStartQuiz = async () => {
    if (!contentItem?.quiz) {
      console.log("No quiz found in contentItem");
      return;
    }

    console.log("Starting quiz...", contentItem.quiz);
    setIsStartingQuiz(true);
    try {
      const response = await startQuizMutation.mutateAsync({
        trailId,
        contentId: contentItemId,
        data: {},
      });

      console.log("Quiz started, response:", response);
      // Response contains attempt object
      setQuizAttemptId(response.attempt.id);
    } catch (error) {
      console.error("Failed to start quiz:", error);
      alert("Não foi possível iniciar o quiz. Tente novamente.");
      // Navigate back on error
      router.back();
    } finally {
      setIsStartingQuiz(false);
    }
  };

  /**
   * Handle quiz completion
   */
  const handleQuizComplete = async (data: any) => {
    try {
      const response = await submitQuizMutation.mutateAsync({
        trailId,
        contentId: contentItemId,
        attemptId: quizAttemptId!,
        data,
      });

      // Check if trail was just completed
      if (response.trailJustCompleted && response.progress) {
        setCompletionData(response.progress);
      }

      // Normalize response to match QuizResults type
      // Note: backend spreads the attempt directly, not nested
      const normalizedResults: QuizResultsType = {
        attempt: response,
        score: response.score || 0,
        earnedPoints: response.earnedPoints || 0,
        totalPoints: response.totalPoints || 0,
        correctCount: response.correctAnswers || 0,
        incorrectCount: response.incorrectAnswers || 0,
        passed: (response.score || 0) >= (response.quiz?.passingScore || 70),
        timeSpentSeconds: response.timeSpent || 0,
        answers: response.answers || [],
      };

      setQuizResults(normalizedResults);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      alert("Não foi possível enviar o quiz. Tente novamente.");
    }
  };

  /**
   * Handle quiz results continue
   */
  const handleQuizContinue = () => {
    // If trail was just completed, navigate to celebration
    if (completionData && trail) {
      // Parse completedContentIds if it's a string
      const completedIds =
        typeof completionData.completedContentIds === "string"
          ? JSON.parse(completionData.completedContentIds || "[]")
          : completionData.completedContentIds || [];

      router.push({
        pathname: "/(app)/trails/celebration",
        params: {
          trailName: trail.name,
          difficulty: trail.difficulty,
          score: String(completionData.currentScore || 0),
          isPassed: String(completionData.isPassed || false),
          timeSpentMinutes: String(completionData.timeSpentMinutes || 0),
          completedContent: String(completedIds.length),
          totalContent: String(trail.content?.length || 0),
        },
      } as any);
    } else {
      router.back();
    }
  };

  /**
   * Handle quiz exit - go back to trail listing
   */
  const handleQuizExit = () => {
    // Navigate directly to trail listing without clearing state
    // This prevents showing the intermediate page
    router.replace(`/(app)/(tabs)/trails/${trailId}` as any);
  };

  /**
   * Handle mark article as read
   */
  const handleMarkArticleRead = async () => {
    try {
      await markArticleReadMutation.mutateAsync({
        trailId,
        contentId: contentItemId,
      });

      router.back();
    } catch (error) {
      console.error("Failed to mark article as read:", error);
    }
  };

  // Auto-start quiz when component mounts if it's a quiz
  useEffect(() => {
    // Only run if we have a quiz and haven't started yet
    if (
      !contentItem?.quizId ||
      quizAttemptId ||
      quizResults ||
      quizStartedRef.current ||
      isStartingQuiz
    ) {
      return;
    }

    quizStartedRef.current = true;

    // Use setTimeout to avoid setState during render
    const startQuizAsync = async () => {
      if (!contentItem?.quiz) {
        console.log("No quiz found in contentItem");
        return;
      }

      console.log("Starting quiz...", contentItem.quiz);
      setIsStartingQuiz(true);
      try {
        const response = await startQuizMutation.mutateAsync({
          trailId,
          contentId: contentItemId,
          data: {},
        });

        console.log("Quiz started, response:", response);
        setQuizAttemptId(response.attempt.id);
      } catch (error) {
        console.error("Failed to start quiz:", error);
        alert("Não foi possível iniciar o quiz. Tente novamente.");
        router.back();
      } finally {
        setIsStartingQuiz(false);
      }
    };

    const timer = setTimeout(() => {
      startQuizAsync();
    }, 100);

    return () => clearTimeout(timer);
  }, [
    contentItem?.quizId,
    contentItem?.quiz,
    quizAttemptId,
    quizResults,
    isStartingQuiz,
    startQuizMutation,
    trailId,
    contentItemId,
    router,
  ]);

  // ============================================================================
  // Early returns
  // ============================================================================

  // Show loading while content is loading
  if (isLoading) {
    return (
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#615FFF" />
        <Text className="text-gray-600 dark:text-gray-300 mt-3">
          Carregando...
        </Text>
      </Container>
    );
  }

  // Show loading only while actively starting quiz
  if (contentItem?.quizId && !quizAttemptId && !quizResults && isStartingQuiz) {
    console.log("Showing loading screen, isStartingQuiz:", isStartingQuiz);
    return (
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#615FFF" />
        <Text className="text-gray-600 dark:text-gray-300 mt-3">
          Iniciando quiz...
        </Text>
      </Container>
    );
  }

  if (!contentItem) {
    return (
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <Text className="text-gray-600 dark:text-gray-300">
          Conteúdo não encontrado
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </Container>
    );
  }

  // ============================================================================
  // Render Methods
  // ============================================================================

  /**
   * Render question content
   */
  const renderQuestion = () => {
    const question = contentItem.question;

    // Normalize question data to match our types
    const normalizedQuestion = {
      ...question,
      prompt: question.questionText || question.prompt,
    };

    return (
      <View className="flex-1">
        {!showQuestionResult ? (
          <QuestionRenderer
            question={normalizedQuestion}
            onSubmit={handleQuestionAnswerChange}
            isSubmitting={false}
            disabled={false}
          />
        ) : questionResult ? (
          <QuestionResultComponent
            result={questionResult}
            question={normalizedQuestion}
          />
        ) : null}
      </View>
    );
  };

  /**
   * Render article content
   */
  const renderArticle = () => {
    const article = contentItem.article;

    return (
      <View>
        {/* Article Content */}
        <View className="bg-white rounded-xl p-6 mb-6 border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <Text className="text-sm text-primary font-semibold mb-4">
            ARTIGO
          </Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
            {article.title}
          </Text>
          <Text className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            {article.summary || "Conteúdo do artigo..."}
          </Text>
          {/* TODO: Render full article content/body */}
        </View>

        {/* Mark as Read Button */}
        {!contentItem.progress?.isCompleted && (
          <TouchableOpacity
            onPress={handleMarkArticleRead}
            disabled={markArticleReadMutation.isPending}
            className="bg-primary rounded-full py-4 items-center"
          >
            {markArticleReadMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Marcar como Lido
              </Text>
            )}
          </TouchableOpacity>
        )}

        {contentItem.progress?.isCompleted && (
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-green-600 rounded-full py-4 items-center"
          >
            <Text className="text-white text-base font-semibold">
              ✓ Artigo Concluído - Voltar
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Render quiz content
   */
  const renderQuiz = () => {
    const quiz = contentItem.quiz;

    // Show start quiz button
    return (
      <View>
        <View className="bg-white rounded-xl p-6 mb-6 border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <Text className="text-sm text-primary font-semibold mb-2">QUIZ</Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
            {quiz.title}
          </Text>
          {quiz.description && (
            <Text className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {quiz.description}
            </Text>
          )}

          {/* Quiz Info */}
          <View className="bg-gray-50 rounded-lg p-4 gap-2 dark:bg-gray-800">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Questões
              </Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {quiz.questions?.length || 0}
              </Text>
            </View>
            {quiz.timeLimit && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  Tempo Limite
                </Text>
                <Text className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {quiz.timeLimit} minutos
                </Text>
              </View>
            )}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Pontuação Mínima
              </Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {quiz.passingScore}%
              </Text>
            </View>
          </View>
        </View>

        {/* Start Quiz Button */}
        <TouchableOpacity
          onPress={handleStartQuiz}
          disabled={isStartingQuiz}
          className="bg-primary rounded-full py-4 items-center"
        >
          {isStartingQuiz ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Iniciar Quiz
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // For quiz mode, render full screen
  if (contentItem.contentType === "quiz" && (quizAttemptId || quizResults)) {
    return (
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950">
        {quizResults ? (
          <QuizResultsComponent
            results={quizResults}
            onContinue={handleQuizContinue}
            showReviewButton={false}
          />
        ) : quizAttemptId && contentItem.quiz ? (
          <QuizAttemptComponent
            quiz={contentItem.quiz}
            attemptId={quizAttemptId}
            onComplete={handleQuizComplete}
            onExit={handleQuizExit}
            trailContext={{
              trailId,
              contentId: contentItemId,
            }}
          />
        ) : null}
      </Container>
    );
  }

  return (
    <Container className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-4">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center mb-4 dark:border-gray-800"
            >
              <ChevronLeft size={24} color="#364153" strokeWidth={2} />
            </TouchableOpacity>

            {/* Trail Title */}
            {trail && (
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {trail.name}
              </Text>
            )}

            {/* Content Type Badge */}
            <View className="flex-row items-center gap-2">
              <View className="bg-blue-50 px-3 py-1.5 rounded-lg dark:bg-blue-900/30">
                <Text className="text-blue-700 dark:text-blue-200 text-xs font-semibold">
                  {contentItem.contentType === "question" && "Questão"}
                  {contentItem.contentType === "quiz" && "Quiz"}
                  {contentItem.contentType === "article" && "Artigo"}
                </Text>
              </View>
              {contentItem.isRequired && (
                <View className="bg-orange-50 px-3 py-1.5 rounded-lg dark:bg-orange-900/30">
                  <Text className="text-orange-700 dark:text-orange-200 text-xs font-semibold">
                    Obrigatório
                  </Text>
                </View>
              )}
              {contentItem.progress?.isCompleted && (
                <View className="bg-green-50 px-3 py-1.5 rounded-lg dark:bg-green-900/30">
                  <Text className="text-green-700 dark:text-green-200 text-xs font-semibold">
                    ✓ Concluído
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Content */}
          <View className="px-6">
            {contentItem.contentType === "question" && renderQuestion()}
            {contentItem.contentType === "article" && renderArticle()}
            {contentItem.contentType === "quiz" && renderQuiz()}
          </View>
        </ScrollView>

        {/* Fixed Bottom Button for Questions */}
        {contentItem.contentType === "question" && (
          <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 pb-8 dark:bg-gray-900 dark:border-gray-800">
            {!showQuestionResult ? (
              <TouchableOpacity
                onPress={() => {
                  // Trigger question submission
                  const answer = getCurrentAnswer();
                  console.log(
                    "[ContentScreen] Verificar clicked, answer:",
                    answer,
                  );
                  if (answer !== null) {
                    handleSubmitQuestion(answer);
                  }
                }}
                disabled={
                  !hasCurrentAnswer() || submitQuestionMutation.isPending
                }
                className={`rounded-2xl py-5 ${
                  !hasCurrentAnswer() || submitQuestionMutation.isPending
                    ? "bg-gray-300 dark:bg-gray-700"
                    : "bg-blue-500"
                }`}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  {submitQuestionMutation.isPending ? (
                    <>
                      <ActivityIndicator color="white" className="mr-2" />
                      <Text className="text-white text-lg font-bold">
                        Verificando...
                      </Text>
                    </>
                  ) : (
                    <Text className="text-white text-lg font-bold">
                      Verificar
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleQuestionContinue}
                className={`rounded-2xl py-5 ${
                  questionResult?.isCorrect ? "bg-green-500" : "bg-red-500"
                }`}
                activeOpacity={0.8}
              >
                <Text className="text-white text-lg font-bold text-center">
                  Continuar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Container>
  );
}
