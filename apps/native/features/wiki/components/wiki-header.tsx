import { View, Text } from "react-native";

interface WikiHeaderProps {}

export function WikiHeader({}: WikiHeaderProps) {
  return (
    <View className="flex-row items-center gap-2.5 mb-7">
      <Text className="text-[28px] font-bold text-gray-900 leading-tight">
        Wiki
      </Text>
      <Text className="text-[28px] font-light text-gray-400 leading-tight">
        Artigos
      </Text>
    </View>
  );
}
