import { View } from "react-native";
import { Image } from "expo-image";
import { InfoCard, InfoCardContent, InfoCardTitle } from "./info-card";

const openBook = require("@/assets/open-book.png");

interface CategoryCardProps {
  title: string;
  bgColor: string;
  iconColor: string;
  onPress?: () => void;
}

export function CategoryCard({ title, bgColor, iconColor, onPress }: CategoryCardProps) {
  return (
    <InfoCard
      onPress={onPress}
      className="rounded-[12.75px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
    >
      <View className="flex-row items-center gap-2.5">
        <View
          className="rounded-lg justify-center items-center"
          style={{
            backgroundColor: bgColor,
            width: 32,
            height: 32,
          }}
        >
          <Image
            source={openBook}
            style={{ width: 16, height: 16 }}
            contentFit="contain"
            tintColor={iconColor}
          />
        </View>
        <InfoCardContent>
          <InfoCardTitle className="text-base text-gray-900 dark:text-gray-50">
            {title}
          </InfoCardTitle>
        </InfoCardContent>
      </View>
    </InfoCard>
  );
}
