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
} from "@/features/trails/hooks";
import { useState } from "react";
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

export default function TrailContentScreen() {
  const params = useLocalSearchParams<{ id: string; contentId: string }>();
  const { id, contentId } = params;
  const trailId = Number(id);
  const contentItemId = Number(contentId);

  const router = useRouter();
  const { data: content, isLoading } = useTrailContent(trailId);
  const submitQuestionMutation = useSubmitTrailQuestion();
  const markArticleReadMutation = useMarkTrailArticleRead();
  const startQuizMutation = useStartTrailQuiz();
  const submitQuizMutation = useSubmitTrailQuiz();

  // Question state
  const [showQuestionResult, setShowQuestionResult] = useState(false);
  const [questionResult, setQuestionResult] = useState<QuestionResultType | null>(null);

  // Quiz state
  const [quizAttemptId, setQuizAttemptId] = useState<number | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResultsType | null>(null);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);

  // Find the specific content item
  const contentItem = content?.find((item: any) => item.id === contentItemId);

  if (isLoading) {
    return (
      <Container className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#155DFC" />
        <Text className="text-gray-600 mt-3">Carregando conteúdo...</Text>
      </Container>
    );
  }

  if (!contentItem) {
    return (
      <Container className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600">Conteúdo não encontrado</Text>
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
  // Handlers
  // ============================================================================

  /**
   * Handle question answer submission
   */
  const handleSubmitQuestion = async (answer: QuestionAnswer) => {
    if (!contentItem?.question) return;

    try {
      const response = await submitQuestionMutation.mutateAsync({
        trailId,
        questionId: contentItem.question.id,
        data: {
          answer: answer as any,
          timeSpentSeconds: 0, // TODO: Track actual time
        },
      });

      // Normalize response to match our types
      const normalizedResult: QuestionResultType = {
        isCorrect: response.isCorrect,
        correctAnswer: response.correctAnswer,
        explanation: response.explanation || undefined,
        score: response.score,
        earnedPoints: response.earnedPoints,
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
    router.back();
  };

  /**
   * Handle start quiz
   */
  const handleStartQuiz = async () => {
    if (!contentItem?.quiz) return;

    setIsStartingQuiz(true);
    try {
      const response = await startQuizMutation.mutateAsync({
        trailId,
        contentId: contentItemId,
        data: {},
      });

      // Response contains attempt object
      setQuizAttemptId(response.attempt.id);
    } catch (error) {
      console.error("Failed to start quiz:", error);
      alert("Não foi possível iniciar o quiz. Tente novamente.");
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

      // Normalize response to match QuizResults type
      const normalizedResults: QuizResultsType = {
        attempt: response.attempt,
        score: response.attempt.score || 0,
        earnedPoints: response.attempt.earnedPoints || 0,
        totalPoints: response.attempt.totalPoints || 0,
        correctCount: response.correctAnswers || 0,
        incorrectCount: response.incorrectAnswers || 0,
        passed: (response.attempt.score || 0) >= (response.quiz.passingScore || 70),
        timeSpentSeconds: response.attempt.timeSpent || 0,
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
    router.back();
  };

  /**
   * Handle quiz exit
   */
  const handleQuizExit = () => {
    setQuizAttemptId(null);
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
      <View>
        {!showQuestionResult ? (
          <QuestionRenderer
            question={normalizedQuestion}
            onSubmit={handleSubmitQuestion}
            isSubmitting={submitQuestionMutation.isPending}
            disabled={false}
          />
        ) : questionResult ? (
          <QuestionResultComponent
            result={questionResult}
            onContinue={handleQuestionContinue}
            isLoading={false}
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
        <View className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
          <Text className="text-sm text-primary font-semibold mb-4">
            ARTIGO
          </Text>
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            {article.title}
          </Text>
          <Text className="text-base text-gray-700 leading-relaxed">
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

    // Show results if quiz is completed
    if (quizResults) {
      return (
        <QuizResultsComponent
          results={quizResults}
          onContinue={handleQuizContinue}
          showReviewButton={false}
        />
      );
    }

    // Show quiz attempt if started
    if (quizAttemptId && quiz) {
      return (
        <QuizAttemptComponent
          quiz={quiz}
          attemptId={quizAttemptId}
          onComplete={handleQuizComplete}
          onExit={handleQuizExit}
          trailContext={{
            trailId,
            contentId: contentItemId,
          }}
        />
      );
    }

    // Show start quiz button
    return (
      <View>
        <View className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
          <Text className="text-sm text-primary font-semibold mb-2">
            QUIZ
          </Text>
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            {quiz.title}
          </Text>
          {quiz.description && (
            <Text className="text-base text-gray-700 leading-relaxed mb-4">
              {quiz.description}
            </Text>
          )}

          {/* Quiz Info */}
          <View className="bg-gray-50 rounded-lg p-4 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Questões</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {quiz.questions?.length || 0}
              </Text>
            </View>
            {quiz.timeLimit && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Tempo Limite</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {quiz.timeLimit} minutos
                </Text>
              </View>
            )}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">Pontuação Mínima</Text>
              <Text className="text-sm font-semibold text-gray-900">
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

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center mb-6 mt-1"
          >
            <ChevronLeft size={24} color="#364153" strokeWidth={2} />
          </TouchableOpacity>

          {/* Content Type Badge */}
          <View className="flex-row items-center gap-2 mb-4">
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-xs font-semibold uppercase">
                {contentItem.contentType === "question" && "Questão"}
                {contentItem.contentType === "quiz" && "Quiz"}
                {contentItem.contentType === "article" && "Artigo"}
              </Text>
            </View>
            {contentItem.isRequired && (
              <View className="bg-orange-100 px-3 py-1 rounded-full">
                <Text className="text-orange-700 text-xs font-semibold">
                  Obrigatório
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View className="px-6 pb-8">
          {contentItem.contentType === "question" && renderQuestion()}
          {contentItem.contentType === "article" && renderArticle()}
          {contentItem.contentType === "quiz" && renderQuiz()}
        </View>
      </ScrollView>
    </Container>
  );
}
