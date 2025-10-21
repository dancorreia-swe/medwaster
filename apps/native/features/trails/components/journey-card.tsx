import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "@/components/icon";
import {
  ChevronRight,
  Clock,
  BookOpen,
  CheckCircle,
} from "lucide-react-native";

export type JourneyStatus =
  | "in-progress"
  | "available"
  | "completed"
  | "locked";

interface JourneyCardProps {
  emoji: string;
  title: string;
  description: string;
  status: JourneyStatus;
  bgColor: string; // Simple background color instead of gradient
  progress?: number; // 0-100 for in-progress
  duration?: string; // e.g. "1.5h"
  modules?: number; // e.g. 10
  onPress?: () => void;
}

export function JourneyCard({
  emoji,
  title,
  description,
  status,
  bgColor,
  progress,
  duration,
  modules,
  onPress,
}: JourneyCardProps) {
  const isLocked = status === "locked";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLocked}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4"
      style={{ opacity: isLocked ? 0.6 : 1 }}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}. ${
        status === "in-progress"
          ? `${progress}% completo`
          : status === "available"
            ? `Disponível. ${duration}, ${modules} módulos`
            : status === "completed"
              ? "Completo"
              : "Bloqueado. Complete trilhas anteriores"
      }`}
      accessibilityState={{ disabled: isLocked }}
    >
      <View className="p-5 flex-row gap-4 items-start">
        {/* Emoji Icon */}
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Text className="text-[32px]">{emoji}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1.5 leading-snug">
            {title}
          </Text>
          <Text className="text-sm text-gray-600 mb-3 leading-relaxed">
            {description}
          </Text>

          {/* Status Footer */}
          {status === "in-progress" && progress !== undefined && (
            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-sm font-semibold text-blue-600 min-w-[44px] text-right">
                {progress}%
              </Text>
            </View>
          )}

          {status === "available" && duration && modules && (
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center gap-1.5">
                <Icon icon={Clock} size={16} className="text-gray-500" />
                <Text className="text-sm text-gray-700 font-medium">
                  {duration}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Icon icon={BookOpen} size={16} className="text-gray-500" />
                <Text className="text-sm text-gray-700 font-medium">
                  {modules} módulos
                </Text>
              </View>
            </View>
          )}

          {status === "completed" && (
            <View className="flex-row items-center gap-2">
              <Icon icon={CheckCircle} size={18} className="text-green-600" />
              <Text className="text-sm font-semibold text-green-600">
                Completo
              </Text>
            </View>
          )}

          {status === "locked" && (
            <Text className="text-sm text-gray-500 font-medium">
              Complete trilhas anteriores
            </Text>
          )}
        </View>

        {/* Arrow */}
        {!isLocked && (
          <Icon icon={ChevronRight} size={24} className="text-gray-400" />
        )}
      </View>
    </TouchableOpacity>
  );
}
