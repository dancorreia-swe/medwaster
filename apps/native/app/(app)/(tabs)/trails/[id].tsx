import { Container } from "@/components/container";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { useTrailStore } from "@/stores/trail-store";

type ModuleStatus = "completed" | "current" | "locked";
type ModuleType = "quiz" | "article" | "question";

interface Module {
  id: string;
  emoji: string;
  title: string;
  instructor: string;
  status: ModuleStatus;
  progress?: number;
  questions?: number;
  type?: ModuleType;
  resourceLink?: string;
}

const moduleStyles = {
  quiz: {
    gradientColors: ["#615FFF", "#AD46FF"],
    borderColor: "transparent",
    backgroundColor: "transparent",
    textColor: "#FFFFFF",
    buttonBg: "#FFFFFF",
    buttonText: "#615FFF",
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

const journeyData = {
  "1": {
    title: "Descarte de Medicamentos",
    description:
      "Aprenda técnicas seguras e protocolos essenciais para o descarte correto de medicamentos hospitalares",
    modules: [
      {
        id: "1",
        emoji: "📚",
        resourceLink: "article/1",
        title: "Introdução ao Descarte Seguro",
        instructor: "Prof. Ana Silva",
        status: "completed" as const,
        type: "article" as const,
      },
      {
        id: "2",
        emoji: "📋",
        resourceLink: "article/2",
        title: "Classificação de Resíduos",
        instructor: "Dr. Carlos Mendes",
        status: "completed" as const,
        type: "article" as const,
      },
      {
        id: "3",
        emoji: "❓",
        resourceLink: "questions/3",
        title: "Pergunta Rápida: Resíduos Classe A",
        instructor: "",
        status: "current" as const,
        questions: 1,
        type: "question" as const,
      },
      {
        id: "4",
        emoji: "🏷️",
        title: "Recipientes e Containers",
        instructor: "Dra. Maria Santos",
        status: "locked" as const,
        type: "article" as const,
      },
      {
        id: "5",
        emoji: "🎯",
        title: "Quiz: Identificação Básica",
        instructor: "",
        status: "locked" as const,
        questions: 8,
        type: "quiz" as const,
      },

      {
        id: "6",
        emoji: "🚨",
        title: "Protocolos Hospitalares",
        instructor: "Prof. João Costa",
        status: "locked" as const,
        type: "article" as const,
      },
      {
        id: "7",
        emoji: "💡",
        title: "Medicamentos Oncológicos",
        instructor: "Dra. Paula Almeida",
        status: "locked" as const,
        type: "article" as const,
      },
      {
        id: "8",
        emoji: "🎯",
        title: "Quiz: Procedimentos",
        instructor: "",
        status: "locked" as const,
        questions: 12,
        type: "quiz" as const,
      },
      {
        id: "9",
        emoji: "🏆",
        title: "Avaliação Final",
        instructor: "",
        status: "locked" as const,
        questions: 25,
        type: "quiz" as const,
      },
    ],
  },
};

export default function JourneyDetail() {
  const params = useLocalSearchParams<{ id: string; "unlock-next"?: string }>();
  const { id } = params;
  const unlockNext = params["unlock-next"] === "true";

  const router = useRouter();
  const journey = journeyData[id as keyof typeof journeyData];

  // Zustand store
  const { trails, initializeTrail, completeCurrentModule, getTrailModules } =
    useTrailStore();
  const modules = getTrailModules(id) || journey?.modules || [];

  // Initialize trail on first load
  useEffect(() => {
    if (journey && !trails[id]) {
      initializeTrail(id, journey.modules);
    }
  }, [id, journey]);

  // Handle unlocking next module when returning from correct answer
  useEffect(() => {
    if (unlockNext) {
      completeCurrentModule(id);
    }
  }, [unlockNext, id]);

  if (!journey) {
    return (
      <Container className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600">Trilha não encontrada</Text>
      </Container>
    );
  }

  const renderModuleCard = (module: Module, index: number) => {
    const isCurrentActivity = module.status === "current";
    const showConnector = index < journey.modules.length - 1;
    const moduleType = module.type || "article";
    const style = moduleStyles[moduleType];

    const handleModulePress = () => {
      if (module.status === "locked") return;

      console.log("Module pressed:", module.id, module.type, module);

      if (module.type === "article" && "resourceLink" in module) {
        console.log("Navigating to article:", module.resourceLink);
        router.push(`/${module.resourceLink}` as any);
      } else if (module.type === "question" && "resourceLink" in module) {
        console.log(
          "Navigating to question with resourceLink:",
          module.resourceLink,
        );
        router.push(`/(app)/${module.resourceLink}` as any);
      } else if (module.type === "question") {
        console.log("Navigating to question with id:", module.id);
        router.push(`/(app)/questions/${module.id}` as any);
      }
    };

    return (
      <View key={module.id} className="mb-0">
        <Pressable
          disabled={module.status === "locked"}
          className={`${module.status === "locked" ? "opacity-50" : ""}`}
          onPress={handleModulePress}
        >
          {isCurrentActivity ? (
            // Current Activity Card - Different styles based on type
            <>
              {style.gradientColors.length > 0 ? (
                // Quiz with gradient
                <LinearGradient
                  colors={style.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-3xl overflow-hidden p-7 shadow-lg mb-4"
                >
                  <View className="flex-row gap-4 mb-5">
                    <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center">
                      <Text className="text-[40px]">{module.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-semibold mb-2">
                        {module.title}
                      </Text>
                      {module.questions && (
                        <Text className="text-white/90 text-base">
                          {module.questions} questões
                        </Text>
                      )}
                    </View>
                  </View>

                  {module.questions && (
                    <View className="flex-row gap-2 mb-5">
                      {Array.from({ length: module.questions || 0 }).map(
                        (_, i) => (
                          <View
                            key={i}
                            className="flex-1 h-2 bg-white/30 rounded-full"
                          />
                        ),
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleModulePress}
                    className="bg-white rounded-full py-4 items-center shadow-md"
                  >
                    <Text className="text-primary text-base font-semibold">
                      Start
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                // Article or Question with border
                <View
                  style={{ borderColor: style.borderColor }}
                  className="bg-white border-2 rounded-3xl p-7 shadow-lg mb-4"
                >
                  <View className="flex-row gap-4 mb-5">
                    <View
                      style={{ backgroundColor: `${style.borderColor}20` }}
                      className="w-20 h-20 rounded-2xl items-center justify-center"
                    >
                      <Text className="text-[40px]">{module.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        style={{ color: style.textColor }}
                        className="text-lg font-semibold mb-2"
                      >
                        {module.title}
                      </Text>
                      {module.instructor && (
                        <Text className="text-gray-500 text-base">
                          {module.instructor}
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleModulePress}
                    style={{ backgroundColor: style.buttonBg }}
                    className="rounded-full py-4 items-center shadow-md"
                  >
                    <Text
                      style={{ color: style.buttonText }}
                      className="text-base font-semibold"
                    >
                      Começar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            // Regular Module Card
            <View className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-2">
              <View className="flex-row items-center">
                {/* Emoji Badge */}
                <View className="relative mr-5">
                  <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center">
                    <Text className="text-[32px]">{module.emoji}</Text>
                  </View>
                  {/* Status Badge */}
                  <View
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white items-center justify-center ${
                      module.status === "completed"
                        ? "bg-green-500"
                        : module.status === "current"
                          ? "bg-green-500"
                          : "bg-gray-400"
                    }`}
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
                    {module.title}
                  </Text>
                  {module.instructor && (
                    <Text className="text-gray-500 text-sm">
                      {module.instructor}
                    </Text>
                  )}
                  {module.questions && (
                    <Text className="text-gray-500 text-sm">
                      {module.questions} questões
                    </Text>
                  )}
                </View>

                {/* Progress Indicator - Only for quizzes */}
                {module.status === "completed" && module.type === "quiz" && (
                  <View className="flex-row gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View
                        key={i}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                    ))}
                  </View>
                )}
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
                  className={`w-1 h-2 rounded-full ${
                    module.status === "completed"
                      ? "bg-blue-400"
                      : "bg-gray-300"
                  }`}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    );
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
            TRILHA DE APRENDIZADO
          </Text>

          {/* Title */}
          <Text className="text-gray-900 text-3xl font-bold leading-tight mb-4">
            {journey.title}
          </Text>

          {/* Description */}
          <Text className="text-gray-600 text-base leading-relaxed">
            {journey.description}
          </Text>
        </View>

        {/* Modules List */}
        <View className="px-6 pb-8">
          {modules.map((module, index) => renderModuleCard(module, index))}
        </View>
      </ScrollView>
    </Container>
  );
}
