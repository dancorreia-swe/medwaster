import { View, Text } from "react-native";

interface WikiHeaderProps {}

export function WikiHeader({}: WikiHeaderProps) {
  return (
    <View className="flex-row items-center gap-2.5 py-3 mb-3">
      <Text className="text-4xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
        Wiki
      </Text>
      <Text className="text-4xl font-light text-gray-400 dark:text-gray-500 leading-tight">
        Artigos
      </Text>
    </View>
  );
}
