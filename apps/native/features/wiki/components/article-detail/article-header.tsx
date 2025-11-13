import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Heart } from "lucide-react-native";

interface ArticleHeaderProps {
  articleIsFavorite: boolean;
  onToggleFavorite: () => void;
}

export function ArticleHeader({
  articleIsFavorite,
  onToggleFavorite,
}: ArticleHeaderProps) {
  const router = useRouter();

  return (
    <View className="px-6 pt-4 pb-3 bg-white flex-row items-center justify-between border-b border-gray-100">
      <TouchableOpacity
        onPress={() => router.back()}
        className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
      >
        <ChevronLeft size={24} color="#364153" strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleFavorite}
        className={`w-11 h-11 rounded-xl items-center justify-center ${
          articleIsFavorite ? "bg-red-50" : "bg-gray-100"
        }`}
      >
        <Heart
          size={22}
          color={articleIsFavorite ? "#ef4444" : "#6b7280"}
          fill={articleIsFavorite ? "#ef4444" : "transparent"}
          strokeWidth={2}
        />
      </TouchableOpacity>
    </View>
  );
}
