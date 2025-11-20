import { View, Text } from "react-native";
import { BookOpenCheck } from "lucide-react-native";

interface CompletionBadgeProps {
  isRead: boolean;
  hasReachedEnd: boolean;
}

export function CompletionBadge({
  isRead,
  hasReachedEnd,
}: CompletionBadgeProps) {
  if (!hasReachedEnd || !isRead) return null;

  return (
    <View className="mt-8 mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
      <View className="flex-row items-center justify-center gap-2">
        <BookOpenCheck size={20} color="#16a34a" strokeWidth={2} />
        <Text className="text-green-700 dark:text-green-100 font-semibold text-center">
          Artigo concluído!
        </Text>
      </View>
    </View>
  );
}
