import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight, Heart } from "lucide-react-native";
import { Icon } from "@/components/icon";

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
  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onFavoriteToggle?.();
  };

  return (
    <TouchableOpacity 
      className="bg-white rounded-2xl shadow-sm shadow-black/10 border border-gray-100"
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}. Nível ${level}, ${duration} de leitura`}
      accessibilityHint="Toque para ler o artigo"
    >
      <View className="flex-row gap-4 px-5 py-5">
        {/* Emoji Icon */}
        <View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center">
          <Text className="text-[32px]">{emoji}</Text>
        </View>

        {/* Content */}
        <View className="flex-1 gap-1.5">
          <Text className="text-base font-bold text-gray-900 leading-snug">
            {title}
          </Text>
          <Text className="text-sm text-gray-600 leading-relaxed">
            {description}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-sm text-gray-500 font-medium">{level}</Text>
            <Text className="text-sm text-gray-400">•</Text>
            <Text className="text-sm text-gray-500 font-medium">{duration}</Text>
          </View>
        </View>

        {/* Icons Column */}
        <View className="flex-col justify-between items-center">
          {/* Arrow Icon */}
          <View className="size-10 rounded-lg items-center justify-center">
            <ChevronRight size={24} className="text-gray-400" />
          </View>
          
          {/* Favorite Heart */}
          <TouchableOpacity
            onPress={handleFavoritePress}
            className="w-11 h-11 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Icon
              icon={Heart}
              size={22}
              className={isFavorite ? "text-red-500" : "text-gray-300"}
              fill={isFavorite ? "#ef4444" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
