import { Text, View } from "react-native";

export function HomeHeader() {
  return (
    <View className="flex-row items-center gap-2.5 px-5 py-4 bg-[#FAFAFA]">
      <View className="w-[35px] h-[35px] rounded-[12.75px] bg-blue-400 justify-center items-center">
        <Text className="text-white text-sm font-semibold">M</Text>
      </View>
      <Text className="text-lg font-semibold text-[#0A0A0A]">MedWaster</Text>
    </View>
  );
}
