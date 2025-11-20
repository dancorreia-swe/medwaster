import { View, Text } from "react-native";
import { useColorScheme } from "@/lib/use-color-scheme";

interface ArticleTitleSectionProps {
  title: string;
  icon?: string;
  categoryName?: string;
  categoryColor?: string;
  categoryInitial?: string;
  readingTimeMinutes?: number;
  isRead?: boolean;
}

export function ArticleTitleSection({
  title,
  icon,
  categoryName,
  categoryColor,
  categoryInitial,
  readingTimeMinutes,
  isRead,
}: ArticleTitleSectionProps) {
  const categoryColorValue = categoryColor || "#155DFC";
  const { isDarkColorScheme } = useColorScheme();
  const badgeBackground = isDarkColorScheme ? "#111827" : "#F9FAFB";

  return (
    <View className="px-6 pt-6 pb-4">
      <View className="flex-row gap-4">
        <View
          style={{
            backgroundColor: badgeBackground,
            ...(isRead
              ? {
                  borderWidth: 1,
                  borderColor: "#22c55e",
                }
              : {
                  borderWidth: 0,
                  borderColor: "transparent",
                }),
          }}
          className="w-16 h-16 rounded-2xl items-center justify-center"
        >
          {icon ? (
            <Text className="text-3xl">{icon}</Text>
          ) : (
            <Text
              className="text-2xl font-semibold"
              style={{ color: categoryColorValue }}
            >
              {categoryInitial}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
            {title}
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {readingTimeMinutes ? (
              <View className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                <Text className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  {readingTimeMinutes} min
                </Text>
              </View>
            ) : null}
            {categoryName ? (
              <View className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30">
                <Text className="text-xs font-semibold text-blue-700 dark:text-blue-200 uppercase">
                  {categoryName}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
