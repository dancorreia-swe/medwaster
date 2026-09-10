import { Container } from "@/components/container";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  QuestionRenderer,
  QuestionResult as QuestionResultCard,
} from "@/features/questions/components";
import { normalizeMatchingAnswer } from "@/features/questions/utils";
import type {
  Question,
  QuestionAnswer,
  QuestionResult as QuestionResultType,
} from "@/features/questions/types";
import {
  useSubmitTrailQuestion,
  useTrail,
  useTrailContent,
} from "@/features/trails/hooks";

/**
 * Standalone question screen.
 *
 * Questions only exist for students inside a trail — `GET /trails/:id/content`
 * is the endpoint that returns a question with its options / blanks / pairs, and
 * `POST /trails/:id/questions/:questionId/submit` is the only endpoint that
 * grades one and records progress. So this route needs the owning trail:
 *
 *   /questions/{questionId}?trailId={trailId}
 *
 * Rendering is delegated to `QuestionRenderer`, which is the same path the trail
 * content screen and the quiz attempt use, so every admin-authored type
 * (multiple_choice, true_false, fill_in_the_blank, matching) renders here.
 */
export default function QuestionDetailsPage() {
  const params = useLocalSearchParams<{
    id: string;
    trailId?: string;
    contentId?: string;
  }>();
  const router = useRouter();

  const questionId = Number(params.id);
  const trailId = Number(params.trailId);
  const hasTrailContext = Number.isFinite(trailId) && trailId > 0;

  const {
    data: content,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTrailContent(hasTrailContext ? trailId : 0);
  // The eden treaty client widens these payloads to `{}` / `unknown`; the trail
  // content screen reads them the same loose way.
  const { data: trailData } = useTrail(hasTrailContext ? trailId : 0);
  const trail = trailData as any;
  const submitQuestionMutation = useSubmitTrailQuestion();

  const [currentAnswer, setCurrentAnswer] = useState<QuestionAnswer | null>(
    null,
  );
  const [questionResult, setQuestionResult] =
    useState<QuestionResultType | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const startedAt = useRef<number>(Date.now());

  // The screen stays mounted when only the route params change, so per-question
  // state has to be reset explicitly.
  useEffect(() => {
    startedAt.current = Date.now();
    setCurrentAnswer(null);
    setQuestionResult(null);
    setShowResult(false);
    setCompletionData(null);
    setSubmitError(null);
  }, [questionId, trailId]);

  const contentItem = useMemo(() => {
    if (!content) return undefined;

    const items = content as any[];
    const byContentId = Number(params.contentId);
    if (Number.isFinite(byContentId) && byContentId > 0) {
      const match = items.find((item) => item.id === byContentId);
      if (match?.questionId === questionId) return match;
    }

    return items.find((item) => item.questionId === questionId);
  }, [content, params.contentId, questionId]);

  const question: Question | undefined = useMemo(() => {
    const raw = contentItem?.question;
    if (!raw) return undefined;

    // `prompt` is the column; `questionText` shows up in some payloads.
    return { ...raw, prompt: raw.prompt || raw.questionText } as Question;
  }, [contentItem]);

  const goBackToTrail = (unlockNext: boolean) => {
    if (!hasTrailContext) {
      router.back();
      return;
    }

    router.replace(
      `/(app)/(tabs)/trails/${trailId}${unlockNext ? "?unlock-next=true" : ""}` as any,
    );
  };

  const handleSubmit = async () => {
    if (!question || currentAnswer === null || !hasTrailContext) return;

    setSubmitError(null);

    try {
      const formattedAnswer: QuestionAnswer =
        question.type === "matching"
          ? normalizeMatchingAnswer(
              currentAnswer as Record<string, string>,
              question.matchingPairs,
            )
          : currentAnswer;

      const timeSpentSeconds = Math.floor(
        (Date.now() - startedAt.current) / 1000,
      );

      const response = (await submitQuestionMutation.mutateAsync({
        trailId,
        questionId: question.id,
        data: { answer: formattedAnswer as any, timeSpentSeconds },
      })) as any;

      if (response.trailJustCompleted && response.progress) {
        setCompletionData(response.progress);
      }

      setQuestionResult({
        isCorrect: response.isCorrect,
        correctAnswer: response.correctAnswer,
        explanation: response.explanation || undefined,
        userAnswer: formattedAnswer,
      });
      setShowResult(true);
    } catch (submitFailure) {
      setSubmitError(
        submitFailure instanceof Error
          ? submitFailure.message
          : "Não foi possível enviar a resposta.",
      );
    }
  };

  const handleContinue = () => {
    if (completionData && trail) {
      const completedIds =
        typeof completionData.completedContentIds === "string"
          ? JSON.parse(completionData.completedContentIds || "[]")
          : completionData.completedContentIds || [];

      router.push({
        pathname: "/(app)/trails/celebration" as any,
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
      return;
    }

    goBackToTrail(Boolean(questionResult?.isCorrect));
  };

  // ==========================================================================
  // Loading / error / empty states
  // ==========================================================================

  if (!Number.isFinite(questionId) || questionId <= 0) {
    return (
      <MessageState
        message="Questão inválida."
        onBack={() => router.back()}
      />
    );
  }

  if (!hasTrailContext) {
    return (
      <MessageState
        message="Abra esta questão a partir da trilha para respondê-la."
        onBack={() => router.back()}
      />
    );
  }

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

  if (isError) {
    return (
      <MessageState
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a questão."
        }
        onBack={() => router.back()}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  if (!question) {
    return (
      <MessageState
        message="Questão não encontrada nesta trilha."
        onBack={() => goBackToTrail(false)}
      />
    );
  }

  // ==========================================================================
  // Question
  // ==========================================================================

  const canSubmit = currentAnswer !== null && !submitQuestionMutation.isPending;

  return (
    <Container className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="px-6 pt-4 pb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center mb-4 dark:border-gray-800"
            >
              <ChevronLeft size={24} color="#364153" strokeWidth={2} />
            </TouchableOpacity>

            {trail && (
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {trail.name}
              </Text>
            )}

            <View className="flex-row items-center gap-2 flex-wrap">
              <View className="bg-blue-50 px-3 py-1.5 rounded-lg dark:bg-blue-900/30">
                <Text className="text-blue-700 dark:text-blue-200 text-xs font-semibold">
                  {QUESTION_TYPE_LABELS[question.type] ?? "Questão"}
                </Text>
              </View>
              {contentItem?.isRequired && (
                <View className="bg-orange-50 px-3 py-1.5 rounded-lg dark:bg-orange-900/30">
                  <Text className="text-orange-700 dark:text-orange-200 text-xs font-semibold">
                    Obrigatório
                  </Text>
                </View>
              )}
              {contentItem?.progress?.isCompleted && (
                <View className="bg-green-50 px-3 py-1.5 rounded-lg dark:bg-green-900/30">
                  <Text className="text-green-700 dark:text-green-200 text-xs font-semibold">
                    ✓ Concluído
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="px-6">
            {!showResult ? (
              <QuestionRenderer
                question={question}
                onSubmit={setCurrentAnswer}
                isSubmitting={submitQuestionMutation.isPending}
                disabled={submitQuestionMutation.isPending}
              />
            ) : questionResult ? (
              <QuestionResultCard
                result={questionResult}
                question={question}
                showFeedback={trail?.showImmediateExplanations ?? true}
              />
            ) : null}

            {submitError && (
              <View className="mt-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
                <Text className="text-red-700 dark:text-red-200 text-base">
                  {submitError}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 pb-8 dark:bg-gray-900 dark:border-gray-800">
          {!showResult ? (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`rounded-2xl py-5 ${
                !canSubmit ? "bg-gray-300 dark:bg-gray-700" : "bg-blue-500"
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
                  <Text className="text-white text-lg font-bold">Verificar</Text>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleContinue}
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
      </View>
    </Container>
  );
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Múltipla escolha",
  true_false: "Verdadeiro ou Falso",
  fill_in_the_blank: "Preencha os espaços",
  matching: "Relacionar colunas",
};

function MessageState({
  message,
  onBack,
  onRetry,
  isRetrying,
}: {
  message: string;
  onBack: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Container className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center px-8">
      <Text className="text-gray-600 dark:text-gray-300 text-center text-base">
        {message}
      </Text>
      <View className="flex-row gap-3 mt-6">
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            disabled={isRetrying}
            className="bg-blue-500 px-6 py-3 rounded-full"
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold">Tentar novamente</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onBack}
          className="bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}
