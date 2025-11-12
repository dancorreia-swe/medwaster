import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight, Heart } from "lucide-react-native";
import { Icon } from "@/components/icon";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  icon?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  difficultyLabel: string;
  difficultyColor: string;
  readingTimeMinutes: number;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onPress?: () => void;
}

function getCategoryInitial(categoryName?: string | null) {
  if (!categoryName || categoryName.length === 0) return "W";
  return categoryName.charAt(0).toUpperCase();
}

function formatReadingTime(minutes: number) {
  const safeMinutes = Math.max(1, Math.round(minutes));
  return `${safeMinutes} min`;
}

export function ArticleCard({
  title,
  excerpt,
  icon,
  categoryName,
  categoryColor,
  difficultyLabel,
  difficultyColor,
  readingTimeMinutes,
  isFavorite = false,
  onFavoriteToggle,
  onPress,
}: ArticleCardProps) {
  const handleFavoritePress = (event: any) => {
    event.stopPropagation();
    onFavoriteToggle?.();
  };

  const categoryInitial = getCategoryInitial(categoryName);
  const readingTime = formatReadingTime(readingTimeMinutes);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl shadow-sm shadow-black/10 border border-gray-100"
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${excerpt}. ${difficultyLabel}, ${readingTime} de leitura.`}
      accessibilityHint="Toque para ler o artigo"
    >
      <View className="flex-row gap-4 px-5 py-5">
        {/* Category Badge or Icon */}
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center border"
          style={{
            backgroundColor: "#F9FAFB",
            borderColor: categoryColor ?? "#E5E7EB",
          }}
        >
          {icon ? (
            <Text className="text-3xl">{icon}</Text>
          ) : (
            <Text
              className="text-2xl font-semibold"
              style={{ color: categoryColor ?? "#155DFC" }}
            >
              {categoryInitial}
            </Text>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 gap-2.5">
          <Text className="text-base font-semibold text-gray-900 leading-snug">
            {title}
          </Text>
          <Text className="text-sm text-gray-600 leading-relaxed">
            {excerpt}
          </Text>

          <View className="flex-row flex-wrap items-center gap-2 mt-1">
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${difficultyColor}1A` }}
            >
              <Text
                className="text-xs font-semibold uppercase"
                style={{ color: difficultyColor }}
              >
                {difficultyLabel}
              </Text>
            </View>
            <View className="px-2.5 py-1 rounded-full bg-gray-100">
              <Text className="text-xs font-semibold text-gray-600">
                {readingTime}
              </Text>
            </View>
            {categoryName ? (
              <View className="px-2.5 py-1 rounded-full bg-blue-50">
                <Text className="text-xs font-semibold text-blue-700">
                  {categoryName}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View className="flex-col justify-between items-center">
          <View className="size-10 rounded-lg items-center justify-center">
            <ChevronRight size={24} color="#9CA3AF" />
          </View>

          <TouchableOpacity
            onPress={handleFavoritePress}
            className="w-11 h-11 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
            }
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
