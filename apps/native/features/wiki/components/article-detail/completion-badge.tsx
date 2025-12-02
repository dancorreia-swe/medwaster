import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { BookOpenCheck } from "lucide-react-native";

interface CompletionBadgeProps {
  isRead: boolean;
  hasReachedEnd: boolean;
  isFromTrail?: boolean;
  onMarkAsRead?: () => void;
  isMarking?: boolean;
}

export function CompletionBadge({
  isRead,
  hasReachedEnd,
  isFromTrail,
  onMarkAsRead,
  isMarking,
}: CompletionBadgeProps) {
  // Show completed badge if article is read
  if (isRead && hasReachedEnd) {
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

  // Show "Mark as Read" button if viewing from trail and not yet read
  if (isFromTrail && !isRead && onMarkAsRead) {
    return (
      <View className="mt-8 mb-4">
        <TouchableOpacity
          onPress={onMarkAsRead}
          disabled={isMarking}
          className="bg-primary rounded-full py-4 items-center"
          activeOpacity={0.8}
        >
          {isMarking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Marcar como Lido
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
