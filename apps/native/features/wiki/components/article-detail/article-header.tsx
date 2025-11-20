import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Heart } from "lucide-react-native";
import { useColorScheme } from "@/lib/use-color-scheme";

interface ArticleHeaderProps {
  articleIsFavorite: boolean;
  onToggleFavorite: () => void;
}

export function ArticleHeader({
  articleIsFavorite,
  onToggleFavorite,
}: ArticleHeaderProps) {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const arrowColor = isDarkColorScheme ? "#E5E7EB" : "#364153";
  const heartIdleColor = isDarkColorScheme ? "#9CA3AF" : "#6b7280";

  return (
    <View className="px-6 pt-4 pb-3 bg-white dark:bg-gray-950 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
      <TouchableOpacity
        onPress={() => router.back()}
        className="w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 items-center justify-center"
      >
        <ChevronLeft size={24} color={arrowColor} strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleFavorite}
        className={`w-11 h-11 rounded-xl items-center justify-center ${
          articleIsFavorite
            ? "bg-red-50 dark:bg-red-900/30"
            : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        <Heart
          size={22}
          color={articleIsFavorite ? "#ef4444" : heartIdleColor}
          fill={articleIsFavorite ? "#ef4444" : "transparent"}
          strokeWidth={2}
        />
      </TouchableOpacity>
    </View>
  );
}
