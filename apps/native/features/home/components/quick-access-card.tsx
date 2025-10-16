import { View } from "react-native";
import { Library, Award, ChevronRight } from "lucide-react-native";
import {
  InfoCard,
  InfoCardIcon,
  InfoCardContent,
  InfoCardTitle,
  InfoCardDescription,
} from "./info-card";

interface QuickAccessCardProps {
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
  icon: "library" | "award";
  onPress?: () => void;
}

export function QuickAccessCard({
  title,
  description,
  iconBgColor,
  iconColor,
  icon,
  onPress,
}: QuickAccessCardProps) {
  const IconComponent = icon === "library" ? Library : Award;

  return (
    <InfoCard onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1">
          <InfoCardIcon
            icon={IconComponent}
            bgColor={iconBgColor}
            iconColor={iconColor}
          />
          <InfoCardContent>
            <InfoCardTitle>{title}</InfoCardTitle>
            <InfoCardDescription>{description}</InfoCardDescription>
          </InfoCardContent>
        </View>
        <ChevronRight size={18} color="#6B7280" strokeWidth={1.5} />
      </View>
    </InfoCard>
  );
}
