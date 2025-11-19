import { View } from "react-native";
import { BookOpen, ChevronRight } from "lucide-react-native";
import {
  InfoCard,
  InfoCardIcon,
  InfoCardContent,
  InfoCardTitle,
} from "./info-card";

interface CategoryCardProps {
  title: string;
  bgColor: string;
  iconColor: string;
  onPress?: () => void;
}

export function CategoryCard({ title, bgColor, iconColor, onPress }: CategoryCardProps) {
  return (
    <InfoCard onPress={onPress} className="rounded-[12.75px]">
      <View className="flex-row items-center gap-2.5">
        <InfoCardIcon
          icon={BookOpen}
          bgColor={bgColor}
          iconColor={iconColor}
          size={32}
          iconSize={16}
        />
        <InfoCardContent>
          <InfoCardTitle className="text-base">{title}</InfoCardTitle>
        </InfoCardContent>
      </View>
    </InfoCard>
  );
}
