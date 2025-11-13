import { View, Text } from "react-native";

interface ArticleTitleSectionProps {
  title: string;
  icon?: string;
  categoryName?: string;
  categoryColor?: string;
  categoryInitial?: string;
  difficulty?: {
    label: string;
    color: string;
  };
  readingTimeMinutes?: number;
  isRead?: boolean;
}

export function ArticleTitleSection({
  title,
  icon,
  categoryName,
  categoryColor,
  categoryInitial,
  difficulty,
  readingTimeMinutes,
  isRead,
}: ArticleTitleSectionProps) {
  const categoryColorValue = categoryColor || "#155DFC";

  return (
    <View className="px-6 pt-6 pb-4">
      <View className="flex-row gap-4">
        <View
          style={{
            backgroundColor: "#F9FAFB",
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
          <Text className="text-2xl font-bold text-gray-900 leading-tight">
            {title}
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {difficulty ? (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${difficulty.color}20` }}
              >
                <Text
                  className="text-xs font-semibold text-gray-900 uppercase"
                  style={{ color: difficulty.color }}
                >
                  {difficulty.label}
                </Text>
              </View>
            ) : null}
            {readingTimeMinutes ? (
              <View className="px-3 py-1 rounded-full bg-gray-100">
                <Text className="text-xs font-semibold text-gray-600 uppercase">
                  {readingTimeMinutes} min
                </Text>
              </View>
            ) : null}
            {categoryName ? (
              <View className="px-3 py-1 rounded-full bg-blue-50">
                <Text className="text-xs font-semibold text-blue-700 uppercase">
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
