import { Container } from "@/components/container";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTrailContent } from "@/features/trails/hooks";

/**
 * Deep-link entry point for a single question.
 *
 * Inside the app every content type is opened through the trail content screen
 * (see `handleModulePress` in `(tabs)/trails/[id].tsx`), so this route does not
 * render a question itself — a second rendering path would drift from the
 * canonical one. It exists because an external link (a notification, a shared
 * URL) knows a *question* id, while the content screen is addressed by *content
 * item* id. This resolves one to the other and hands off:
 *
 *   /questions/{questionId}?trailId={trailId}
 *     -> /trails/{trailId}/content/{contentId}
 *
 * Questions are only fetchable and gradeable through trail-scoped endpoints, so
 * the owning trail has to be part of the link.
 */
export default function QuestionDeepLinkScreen() {
  const params = useLocalSearchParams<{ id: string; trailId?: string }>();
  const router = useRouter();

  const questionId = Number(params.id);
  const trailId = Number(params.trailId);
  const hasTrailContext = Number.isFinite(trailId) && trailId > 0;
  const hasQuestionId = Number.isFinite(questionId) && questionId > 0;

  const {
    data: content,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTrailContent(hasTrailContext && hasQuestionId ? trailId : 0);

  const contentId = useMemo(() => {
    if (!content) return undefined;
    const match = (content as any[]).find(
      (item) => item.questionId === questionId,
    );
    return match?.id as number | undefined;
  }, [content, questionId]);

  if (!hasQuestionId) {
    return <MessageState message="Questão inválida." onBack={router.back} />;
  }

  if (!hasTrailContext) {
    return (
      <MessageState
        message="Abra esta questão a partir da trilha para respondê-la."
        onBack={router.back}
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
        onBack={router.back}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  if (!contentId) {
    return (
      <MessageState
        message="Questão não encontrada nesta trilha."
        onBack={() => router.replace(`/(app)/(tabs)/trails/${trailId}` as any)}
      />
    );
  }

  return (
    <Redirect href={`/trails/${trailId}/content/${contentId}` as any} />
  );
}

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
            accessibilityRole="button"
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
          accessibilityRole="button"
          className="bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}
