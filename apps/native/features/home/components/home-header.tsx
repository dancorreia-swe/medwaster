import { Text, View } from "react-native";
import { Image } from "expo-image";
import { BRAND_LOGO_COMPACT, BRAND_NAME } from "@/lib/brand";

export function HomeHeader() {
  return (
    <View className="flex-row items-center gap-2.5 px-5 py-4 bg-white dark:bg-[#102A43]">
      <View className="w-[35px] h-[35px] rounded-xl bg-white items-center justify-center">
        <Image source={BRAND_LOGO_COMPACT} className="w-[29px] h-[29px]" contentFit="contain" />
      </View>
      <Text className="text-lg font-semibold text-[#102A43] dark:text-white">{BRAND_NAME}</Text>
    </View>
  );
}
