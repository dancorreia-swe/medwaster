import { Text, TouchableOpacity, View } from "react-native";
import { Library, Award, ChevronRight } from "lucide-react-native";

interface QuickAccessCardProps {
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
  icon: "library" | "award";
}

export function QuickAccessCard({
  title,
  description,
  iconBgColor,
  iconColor,
  icon,
}: QuickAccessCardProps) {
  const IconComponent = icon === "library" ? Library : Award;

  return (
    <TouchableOpacity className="bg-white rounded-[12.75px] p-3.5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View
            className="w-[35px] h-[35px] rounded-[12.75px] justify-center items-center"
            style={{ backgroundColor: iconBgColor }}
          >
            <IconComponent size={18} color={iconColor} strokeWidth={1.5} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-[#0A0A0A] mb-0.5">
              {title}
            </Text>
            <Text className="text-[10.5px] text-[#6B7280]">{description}</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#6B7280" strokeWidth={1.5} />
      </View>
    </TouchableOpacity>
  );
}
