import { Text, View, TouchableOpacity } from "react-native";
import { ChevronRight, Lock, CheckCircle2 } from "lucide-react-native";

interface TrailCardProps {
  trail: {
    id: number;
    name: string;
    description: string | null;
    difficulty: "basic" | "intermediate" | "advanced";
    estimatedTimeMinutes: number | null;
    coverImageUrl: string | null;
    progress?: {
      isEnrolled: boolean;
      isCompleted: boolean;
      isPassed: boolean;
      currentScore: number | null;
      progressPercentage: number;
    };
    isLocked?: boolean;
  };
  onPress: () => void;
}

const difficultyConfig = {
  basic: {
    label: "Básico",
    color: "bg-green-100",
    textColor: "text-green-700",
  },
  intermediate: {
    label: "Intermediário",
    color: "bg-yellow-100",
    textColor: "text-yellow-700",
  },
  advanced: {
    label: "Avançado",
    color: "bg-red-100",
    textColor: "text-red-700",
  },
};

export function TrailCard({ trail, onPress }: TrailCardProps) {
  const difficulty = difficultyConfig[trail.difficulty];
  const isEnrolled = trail.progress?.isEnrolled;
  const isCompleted = trail.progress?.isCompleted;
  const progressPercentage = trail.progress?.progressPercentage || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={trail.isLocked}
      className={`bg-white rounded-xl border border-gray-200 p-4 mb-3 ${trail.isLocked ? "opacity-50" : ""}`}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-base font-bold text-gray-900">
              {trail.name}
            </Text>
            {trail.isLocked && (
              <Lock size={16} color="#9CA3AF" strokeWidth={2} />
            )}
          </View>
          {trail.description && (
            <Text className="text-sm text-gray-600" numberOfLines={2}>
              {trail.description}
            </Text>
          )}
        </View>
        {!trail.isLocked && (
          <View className="ml-3">
            {isCompleted ? (
              <CheckCircle2 size={24} color="#00A63E" strokeWidth={2} />
            ) : (
              <ChevronRight size={24} color="#9CA3AF" strokeWidth={2} />
            )}
          </View>
        )}
      </View>

      {/* Badges */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className={`${difficulty.color} px-3 py-1 rounded-full`}>
          <Text className={`text-xs font-semibold ${difficulty.textColor}`}>
            {difficulty.label}
          </Text>
        </View>
        {trail.estimatedTimeMinutes && (
          <View className="bg-gray-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-gray-700">
              ~{trail.estimatedTimeMinutes} min
            </Text>
          </View>
        )}
        {isCompleted && (
          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-green-700">
              Concluída
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar (if enrolled) */}
      {isEnrolled && !isCompleted && (
        <View>
          <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <View
              className="h-full bg-primary"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
          <Text className="text-xs text-gray-600">
            {progressPercentage}% concluído
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
