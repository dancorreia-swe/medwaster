import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight, Heart } from "lucide-react-native";
import { Icon } from "@/components/icon";
import { useState } from "react";

interface ArticleCardProps {
  emoji: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export function ArticleCard({
  emoji,
  title,
  description,
  level,
  duration,
  isFavorite = false,
  onFavoriteToggle,
}: ArticleCardProps) {
  const [localFavorite, setLocalFavorite] = useState(isFavorite);

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    setLocalFavorite(!localFavorite);
    onFavoriteToggle?.();
  };

  return (
    <TouchableOpacity className="bg-white rounded-xl shadow-sm shadow-black/10">
      <View className="flex-row gap-3.5 px-3.5 py-3.5">
        {/* Emoji Icon */}
        <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center">
          <Text className="text-xl">{emoji}</Text>
        </View>

        {/* Content */}
        <View className="flex-1 gap-1">
          <Text className="text-sm font-semibold text-gray-900 leading-snug">
            {title}
          </Text>
          <Text className="text-sm text-gray-500 leading-tight">
            {description}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Text className="text-sm text-gray-400">{level}</Text>
            <Text className="text-sm text-gray-400">•</Text>
            <Text className="text-sm text-gray-400">{duration}</Text>
          </View>
        </View>

        {/* Icons Column */}
        <View className="flex-col justify-between items-center">
          {/* Arrow Icon */}
          <View className="size-8 rounded-lg items-center justify-center">
            <ChevronRight size={16} className="text-gray-900" />
          </View>
          
          {/* Favorite Heart */}
          <TouchableOpacity
            onPress={handleFavoritePress}
            className="w-8 h-8 items-center justify-center"
          >
            <Icon
              icon={Heart}
              size={18}
              className={localFavorite ? "text-red-500" : "text-gray-300"}
              fill={localFavorite ? "#ef4444" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
