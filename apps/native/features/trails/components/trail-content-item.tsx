import { Text, View, TouchableOpacity, Image } from "react-native";
import { CheckCircle2, Lock } from "lucide-react-native";
import multipleChoiceIcon from "@/assets/questions/multiple-choice.png";
import trueFalseIcon from "@/assets/questions/true-false.png";
import fillInTheBlanksIcon from "@/assets/questions/fill-in-the-blanks.png";
import matchingPairsIcon from "@/assets/questions/matching-pairs.png";
import quizBookletIcon from "@/assets/quiz-booklet.png";
import openBookIcon from "@/assets/open-book.png";

interface TrailContentItemProps {
  content: {
    id: number;
    contentType: "question" | "quiz" | "article";
    sequence: number;
    isRequired: boolean;
    points: number | null;
    passingScore: number | null;
    question?: {
      id: number;
      questionText: string;
      type?: string;
    };
    quiz?: {
      id: number;
      title: string;
    };
    article?: {
      id: number;
      title: string;
    };
    progress?: {
      isCompleted: boolean;
      score: number | null;
      attempts: number;
    };
  };
  isLocked?: boolean;
  onPress: () => void;
}

const contentTypeConfig = {
  question: {
    label: "Questão",
    color: "#155DFC",
  },
  quiz: {
    label: "Quiz",
    color: "#7C3AED",
  },
  article: {
    label: "Artigo",
    color: "#00A63E",
  },
};

export function TrailContentItem({
  content,
  isLocked,
  onPress,
}: TrailContentItemProps) {
  const config = contentTypeConfig[content.contentType];
  const isCompleted = content.progress?.isCompleted;

  const getQuestionIcon = (questionType?: string) => {
    switch (questionType) {
      case "multiple_choice":
        return multipleChoiceIcon;
      case "true_false":
        return trueFalseIcon;
      case "fill_in_the_blank":
        return fillInTheBlanksIcon;
      case "matching":
        return matchingPairsIcon;
      default:
        return multipleChoiceIcon;
    }
  };

  // Get title based on content type
  const getTitle = () => {
    if (content.contentType === "question" && content.question) {
      return content.question.questionText;
    }
    if (content.contentType === "quiz" && content.quiz) {
      return content.quiz.title;
    }
    if (content.contentType === "article" && content.article) {
      return content.article.title;
    }
    return "Conteúdo";
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLocked}
      className={`bg-white rounded-xl border border-gray-200 p-4 mb-3 ${isLocked ? "opacity-50" : ""}`}
    >
      <View className="flex-row items-center gap-3">
        {/* Icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${config.color}15` }}
        >
          {content.contentType === "question" ? (
            <Image
              source={getQuestionIcon(content.question?.type)}
              style={{ width: 20, height: 20, borderRadius: 4 }}
              resizeMode="contain"
            />
          ) : content.contentType === "quiz" ? (
            <Image
              source={quizBookletIcon}
              style={{ width: 20, height: 20, borderRadius: 4 }}
              resizeMode="contain"
            />
          ) : content.contentType === "article" ? (
            <Image
              source={openBookIcon}
              style={{ width: 20, height: 20, borderRadius: 4 }}
              resizeMode="contain"
            />
          ) : (
            <CheckCircle2 size={20} color={config.color} strokeWidth={2} />
          )}
        </View>

        {/* Content Info */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-xs font-semibold text-gray-500">
              {config.label}
            </Text>
            {content.isRequired && (
              <View className="bg-orange-100 px-2 py-0.5 rounded">
                <Text className="text-xs font-semibold text-orange-700">
                  Obrigatório
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm font-medium text-gray-900" numberOfLines={2}>
            {getTitle()}
          </Text>
          {content.points && (
            <Text className="text-xs text-gray-500 mt-1">
              {content.points} {content.points === 1 ? "ponto" : "pontos"}
            </Text>
          )}
        </View>

        {/* Status Icon */}
        <View>
          {isLocked ? (
            <Lock size={20} color="#9CA3AF" strokeWidth={2} />
          ) : isCompleted ? (
            <View className="flex-col items-center">
              <CheckCircle2 size={24} color="#00A63E" strokeWidth={2} />
              {content.progress?.score !== null && content.progress?.score !== undefined && (
                <Text className="text-xs font-semibold text-green-600 mt-1">
                  {content.progress.score}%
                </Text>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
