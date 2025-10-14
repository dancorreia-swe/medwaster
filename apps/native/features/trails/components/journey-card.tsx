import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "@/components/icon";
import { ChevronRight, Clock, BookOpen, CheckCircle } from "lucide-react-native";

export type JourneyStatus = "in-progress" | "available" | "completed" | "locked";

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
      className="bg-white rounded-xl border border-gray-100 shadow-sm mb-3.5"
      style={{ opacity: isLocked ? 0.6 : 1 }}
    >
      <View className="p-3.5 flex-row items-center gap-3.5">
        {/* Emoji Icon */}
        <View 
          className="w-14 h-14 rounded-2xl items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Text className="text-[21px]">{emoji}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
            {title}
          </Text>
          <Text className="text-xs text-gray-600 mb-2 leading-tight">
            {description}
          </Text>

          {/* Status Footer */}
          {status === "in-progress" && progress !== undefined && (
            <View className="flex-row items-center gap-2.5">
              <View className="flex-1 h-[5.25px] bg-blue-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-[10.5px] font-medium text-blue-600">
                {progress}%
              </Text>
            </View>
          )}

          {status === "available" && duration && modules && (
            <View className="flex-row items-center gap-2.5">
              <View className="flex-row items-center gap-1">
                <Icon icon={Clock} size={12.25} className="text-gray-600" />
                <Text className="text-[10.5px] text-gray-600">{duration}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Icon icon={BookOpen} size={12.25} className="text-gray-600" />
                <Text className="text-[10.5px] text-gray-600">{modules} módulos</Text>
              </View>
            </View>
          )}

          {status === "completed" && (
            <View className="flex-row items-center gap-1.5">
              <Icon icon={CheckCircle} size={14} className="text-green-600" />
              <Text className="text-xs font-medium text-green-600">Completo</Text>
            </View>
          )}

          {status === "locked" && (
            <Text className="text-xs text-gray-600">
              Complete trilhas anteriores
            </Text>
          )}
        </View>

        {/* Arrow */}
        {!isLocked && (
          <Icon icon={ChevronRight} size={17.5} className="text-gray-400" />
        )}
      </View>
    </TouchableOpacity>
  );
}

