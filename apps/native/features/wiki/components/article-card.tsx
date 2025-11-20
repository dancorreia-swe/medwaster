import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight, Heart } from "lucide-react-native";
import { Icon } from "@/components/icon";
import { useColorScheme } from "@/lib/use-color-scheme";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  icon?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  readingTimeMinutes: number;
  isFavorite?: boolean;
  isRead?: boolean;
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
  readingTimeMinutes,
  isFavorite = false,
  isRead = false,
  onFavoriteToggle,
  onPress,
}: ArticleCardProps) {
  const handleFavoritePress = (event: any) => {
    event.stopPropagation();
    onFavoriteToggle?.();
  };

  const categoryInitial = getCategoryInitial(categoryName);
  const readingTime = formatReadingTime(readingTimeMinutes);
  const { isDarkColorScheme } = useColorScheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm shadow-black/10 dark:shadow-none border border-gray-100 dark:border-gray-800"
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${excerpt}. ${readingTime} de leitura.${isRead ? " Já lido." : ""}`}
      accessibilityHint="Toque para ler o artigo"
    >
      <View className="flex-row gap-4 px-5 py-5">
        {/* Category Badge or Icon */}
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: isRead
              ? isDarkColorScheme
                ? "#0f172a" // gray-950 for read in dark
                : "#ecfdf3" // green tint in light
              : isDarkColorScheme
                ? "#111827" // gray-900-ish for unread in dark
                : "#F9FAFB",
            ...(isRead && {
              borderWidth: 1,
              borderColor: "#22c55e",
            }),
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
          <Text className="text-base font-semibold text-gray-900 dark:text-gray-50 leading-snug">
            {title}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {excerpt}
          </Text>

          <View className="flex-row flex-wrap items-center gap-2 mt-1">
            <View className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              <Text className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {readingTime}
              </Text>
            </View>
            {categoryName ? (
              <View className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30">
                <Text className="text-xs font-semibold text-blue-700 dark:text-blue-200">
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
              className={
                isFavorite ? "text-red-500" : "text-gray-300 dark:text-gray-500"
              }
              fill={isFavorite ? "#ef4444" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
