import { Container } from "@/components/container";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  Edit3,
  Link2,
  ListChecks,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useTrail,
  useTrailProgress,
  useTrailContent,
  useEnrollInTrail,
} from "@/features/trails/hooks";
import { HtmlText } from "@/components/HtmlText";

type ModuleStatus = "completed" | "current" | "locked";
type ModuleType = "quiz" | "article" | "question";

interface Module {
  id: string;
  contentId: number;
  trailId: number;
  emoji: string;
  title: string;
  instructor: string;
  status: ModuleStatus;
  progress?: any;
  questions?: number;
  type: ModuleType;
  isRequired: boolean;
  points: number | null;
  questionType?: "multiple_choice" | "true_false" | "fill_in_the_blank" | "matching";
}

const moduleStyles = {
  quiz: {
    gradientColors: [] as string[], // No longer using gradient
    borderColor: "#615FFF", // Purple border for quiz
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    buttonBg: "#615FFF",
    buttonText: "#FFFFFF",
  },
  article: {
    gradientColors: [] as string[],
    borderColor: "#3B82F6", // primary blue
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    buttonBg: "#3B82F6",
    buttonText: "#FFFFFF",
  },
  question: {
    gradientColors: [] as string[],
    borderColor: "#8B5CF6", // purple
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    buttonBg: "#8B5CF6",
    buttonText: "#FFFFFF",
  },
};

const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\{\{\d+\}\}/g, "_____")
    .trim();
};

const getContentTitle = (content: any): string => {
  if (!content) return "Conteúdo";
  // Check by ID presence since contentType doesn't exist in DB
  if (content.questionId && content.question) {
    const questionText = content.question.prompt || content.question.questionText || "Questão";
    return stripHtml(questionText);
  }
  if (content.quizId && content.quiz) {
    return content.quiz.title || "Quiz";
  }
  if (content.articleId && content.article) {
    return content.article.title || "Artigo";
  }
  return "Conteúdo";
};

const getContentEmoji = (content: any): string => {
  if (!content) return "📄";
  // Derive type from ID presence
  if (content.questionId) return "❓";
  if (content.quizId) return "🎯";
  if (content.articleId) return "📚";
  return "📄";
};

const getQuestionCount = (content: any) => {
  if (content.quizId && content.quiz) {
    return content.quiz.questions?.length || 0;
  }
  if (content.questionId) {
    return 1;
  }
  return undefined;
};

const getQuestionTypeIcon = (questionType?: string) => {
  switch (questionType) {
    case "multiple_choice":
      return { Icon: ListChecks, color: "#8B5CF6", label: "Múltipla escolha" };
    case "true_false":
      return { Icon: CheckCircle2, color: "#10B981", label: "Verdadeiro ou Falso" };
    case "fill_in_the_blank":
      return { Icon: Edit3, color: "#F59E0B", label: "Preencher" };
    case "matching":
      return { Icon: Link2, color: "#EC4899", label: "Relacionar" };
    default:
      return null;
  }
};

export default function JourneyDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const { id } = params;
  const trailId = Number(id);

  const router = useRouter();

  const { data: trail, isLoading: trailLoading } = useTrail(trailId);
  const {
    data: progress,
    isLoading: progressLoading,
    isError: progressError,
  } = useTrailProgress(trailId);

  const {
    data: content,
    isLoading: contentLoading,
    isError: contentError,
  } = useTrailContent(trailId);

  const enrollMutation = useEnrollInTrail();

  const isLoading = trailLoading || (progressLoading && !progressError);

  const modules =
    content
      ?.filter((item: any) => item && item.id) // Filter out null/undefined items
      ?.map((item: any, index: number) => {
      const isCompleted = item.progress?.isCompleted || false;
      const isEnrolled = progress?.isEnrolled || false;

      let status: ModuleStatus = "locked";
      if (!isEnrolled) {
        status = index === 0 ? "current" : "locked";
      } else if (isCompleted) {
        status = "completed";
      } else {
        const previousIndex = index - 1;
        if (previousIndex < 0) {
          status = "current";
        } else {
          const previousContent = content[previousIndex];
          if (previousContent?.progress?.isCompleted) {
            status = "current";
          }
        }
      }

      // Derive content type from ID presence
      let contentType: ModuleType;
      if (item.questionId) {
        contentType = "question";
      } else if (item.quizId) {
        contentType = "quiz";
      } else if (item.articleId) {
        contentType = "article";
      } else {
        contentType = "article"; // fallback
      }

      const emoji = getContentEmoji(item);
      const title = getContentTitle(item);
      
      return {
        id: String(item.id),
        contentId: item.id,
        trailId: trailId,
        emoji: emoji || "📄", // Ensure we always have a valid emoji
        title: title || "Conteúdo", // Ensure we always have a valid title
        instructor: "",
        status,
        type: contentType,
        questions: getQuestionCount(item),
        isRequired: item.isRequired,
        points: item.points,
        progress: item.progress,
        articleId: item.articleId, // Store articleId for navigation
        questionId: item.questionId, // Store questionId for reference
        quizId: item.quizId, // Store quizId for reference
        questionType: item.question?.type, // Store question type for icon
      };
    }) || [];

  if (isLoading) {
    return (
      <Container className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#155DFC" />
        <Text className="text-gray-600 mt-3">Carregando trilha...</Text>
      </Container>
    );
  }

  if (!trail) {
    return (
      <Container className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600">Trilha não encontrada</Text>
      </Container>
    );
  }

  const isEnrolled = progress?.isEnrolled || false;

  const renderModuleCard = (module: any, index: number) => {
    const isCurrentActivity = module.status === "current";
    const showConnector = index < modules.length - 1;
    const moduleType = module.type || "article";
    const style = moduleStyles[moduleType] || moduleStyles.article; // Fallback to article style
    const totalQuestions =
      module.questions ??
      module.quiz?.questions?.length ??
      0;

    const handleModulePress = () => {
      if (module.status === "locked") return;

      // Backend handles auto-enrollment, so just navigate
      // For articles, navigate directly to the article detail page
      // Pass trail context as query params so article page can mark content complete
      if (module.type === "article" && module.articleId) {
        router.push(
          `/article/${module.articleId}?trailId=${module.trailId}&contentId=${module.contentId}` as any
        );
      } else {
        // For questions and quizzes, use the trail content screen
        router.push(
          `/trails/${module.trailId}/content/${module.contentId}` as any,
        );
      }
    };

    return (
      <View key={module.id} className="mb-0">
        <Pressable
          disabled={module.status === "locked"}
          className={module.status === "locked" ? "opacity-50" : ""}
          onPress={handleModulePress}
        >
          {isCurrentActivity ? (
            // Current Activity Card - Consistent bordered style for all types
            <View
              style={{ borderColor: style.borderColor }}
              className="bg-white border-2 rounded-3xl p-7 shadow-lg mb-4"
            >
              <View className="flex-row gap-4 mb-5">
                <View
                  style={{ backgroundColor: style.borderColor ? `${style.borderColor}20` : "#3B82F620" }}
                  className="w-20 h-20 rounded-2xl items-center justify-center"
                >
                  <Text className="text-[40px]">{module.emoji || "📄"}</Text>
                </View>
                <View className="flex-1">
                  <Text
                    style={{ color: style.textColor }}
                    className="text-lg font-semibold mb-2"
                  >
                    {module.title || "Conteúdo"}
                  </Text>
                  {totalQuestions > 0 && module.type === "quiz" && (
                    <Text className="text-gray-500 text-base">
                      {totalQuestions} questões
                    </Text>
                  )}
                  {module.instructor && (
                    <Text className="text-gray-500 text-base">
                      {module.instructor}
                    </Text>
                  )}
                  {/* Question Type Badge for current activity */}
                  {module.type === "question" && module.questionType && (
                    <View className="flex-row items-center gap-1.5 mt-1">
                      {(() => {
                        const typeInfo = getQuestionTypeIcon(module.questionType);
                        if (!typeInfo) return null;
                        const { Icon, color, label } = typeInfo;
                        return (
                          <>
                            <Icon size={14} color={color} strokeWidth={2} />
                            <Text className="text-xs font-medium" style={{ color }}>
                              {label || "Questão"}
                            </Text>
                          </>
                        );
                      })()}
                    </View>
                  )}
                </View>
              </View>

              {/* Progress bars for quizzes */}
              {totalQuestions > 0 && module.type === "quiz" && (
                <View className="flex-row gap-2 mb-5">
                  {Array.from({ length: totalQuestions }).map((_, i) => (
                    <View
                      key={i}
                      style={{ backgroundColor: `${style.borderColor}40` }}
                      className="flex-1 h-2 rounded-full"
                    />
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={handleModulePress}
                style={{ backgroundColor: style.buttonBg }}
                className="rounded-full py-4 items-center"
                activeOpacity={0.8}
              >
                <Text
                  style={{ color: style.buttonText }}
                  className="text-base font-bold"
                >
                  Começar
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Regular Module Card
            <View className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-2">
              <View className="flex-row items-center">
                {/* Emoji Badge */}
                <View className="relative mr-5">
                  <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center">
                    <Text className="text-[32px]">{module.emoji || "📄"}</Text>
                  </View>
                  {/* Status Badge */}
                  <View
                    className={
                      module.status === "completed" || module.status === "current"
                        ? "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white items-center justify-center bg-green-500"
                        : "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white items-center justify-center bg-gray-400"
                    }
                  >
                    {module.status === "completed" && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                    {module.status === "locked" && (
                      <Text className="text-white text-xs">🔒</Text>
                    )}
                  </View>
                </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-gray-900 text-base font-semibold mb-1">
            {module.title || "Conteúdo"}
          </Text>
          {module.instructor && (
            <Text className="text-gray-500 text-sm">
              {module.instructor}
            </Text>
          )}
          {totalQuestions > 0 && module.type === "quiz" && (
            <Text className="text-gray-500 text-sm">
              {totalQuestions} questões
            </Text>
          )}
                  {/* Question Type Badge */}
                  {module.type === "question" && module.questionType && (
                    <View className="flex-row items-center gap-1.5 mt-1">
                      {(() => {
                        const typeInfo = getQuestionTypeIcon(module.questionType);
                        if (!typeInfo) return null;
                        const { Icon, color, label } = typeInfo;
                        return (
                          <>
                            <Icon size={14} color={color} strokeWidth={2} />
                            <Text className="text-xs" style={{ color }}>
                              {label}
                            </Text>
                          </>
                        );
                      })()}
                    </View>
                  )}
                </View>

                {/* Progress Indicator - Only for quizzes */}
                {module.status === "completed" &&
                  module.type === "quiz" &&
                  (() => {
                    const questionCount = totalQuestions;
                    const dotsToShow = Math.max(
                      Math.min(questionCount || 1, 6),
                      1,
                    );
                    const remaining =
                      questionCount > dotsToShow
                        ? questionCount - dotsToShow
                        : 0;

                    return (
                      <View className="flex-row items-center gap-1.5">
                        {Array.from({ length: dotsToShow }).map((_, i) => (
                          <View
                            key={i}
                            className="w-2 h-2 bg-green-500 rounded-full"
                          />
                        ))}
                        {remaining > 0 && (
                          <Text className="text-[10px] font-semibold text-green-700">
                            +{remaining}
                          </Text>
                        )}
                      </View>
                    );
                  })()}
              </View>
            </View>
          )}
        </Pressable>

        {/* Connector - Dashed Path like a Map */}
        {showConnector && (
          <View className="items-center py-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="mb-1">
                <View
                  className={
                    module.status === "completed"
                      ? "w-1 h-2 rounded-full bg-blue-400"
                      : "w-1 h-2 rounded-full bg-gray-300"
                  }
                />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const difficultyLabels: Record<string, string> = {
    basic: "Básico",
    intermediate: "Intermediário",
    advanced: "Avançado",
  };

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-8">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.navigate("/(app)/(tabs)/trails")}
            className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center mb-6 mt-1"
          >
            <ChevronLeft size={24} color="#364153" strokeWidth={2} />
          </TouchableOpacity>

          {/* Category Label */}
          <Text className="text-primary text-xs font-semibold tracking-wider mb-2 uppercase">
            TRILHA DE APRENDIZADO • {difficultyLabels[trail.difficulty] || trail.difficulty}
          </Text>

          {/* Title */}
          <Text className="text-gray-900 text-3xl font-bold leading-tight mb-4">
            {trail.name}
          </Text>

          {/* Description */}
          {trail.description && (
            <HtmlText 
              html={trail.description} 
              baseStyle={{ fontSize: 16, fontWeight: "400", color: "#4B5563", lineHeight: 24 }}
            />
          )}

          {/* Metadata */}
          <View className="flex-row items-center gap-4 mb-4">
            {trail.estimatedTimeMinutes && (
              <View className="flex-row items-center gap-1">
                <Text className="text-gray-600 text-sm">
                  ⏱️ {trail.estimatedTimeMinutes} min
                </Text>
              </View>
            )}
            {modules.length > 0 && (
              <View className="flex-row items-center gap-1">
                <Text className="text-gray-600 text-sm">
                  📚 {modules.length} módulos
                </Text>
              </View>
            )}
          </View>

          {/* Info Badge - Not enrolled */}
          {!isEnrolled && (
            <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <Text className="text-blue-900 font-semibold mb-1">
                ✨ Comece sua jornada
              </Text>
              <Text className="text-blue-700 text-sm">
                Clique em qualquer módulo para começar. Você será inscrito automaticamente!
              </Text>
            </View>
          )}

          {/* Progress Badge - Enrolled with progress */}
          {isEnrolled && progress && progress.progressPercentage > 0 && (
            <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-blue-900 font-semibold">
                  Seu Progresso
                </Text>
                <Text className="text-blue-600 font-bold">
                  {progress.progressPercentage || 0}%
                </Text>
              </View>
              <View className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-600"
                  style={{ width: `${progress.progressPercentage || 0}%` }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Modules List - Always shown */}
        {modules.length > 0 && (
          <View className="px-6 pb-8">
            {modules.map((module: any, index: number) =>
              renderModuleCard(module, index),
            )}
          </View>
        )}
      </ScrollView>
    </Container>
  );
}
