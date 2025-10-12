import { Text, TouchableOpacity, View } from "react-native";
import { BookOpen } from "lucide-react-native";

interface CategoryCardProps {
  title: string;
  bgColor: string;
  iconColor: string;
}

export function CategoryCard({ title, bgColor, iconColor }: CategoryCardProps) {
  return (
    <TouchableOpacity className="bg-white rounded-[12.75px] p-3.5 shadow-sm">
      <View className="flex-row items-center gap-2.5">
        <View
          className="size-8 rounded-[14px] justify-center items-center"
          style={{ backgroundColor: bgColor }}
        >
          <BookOpen size={16} color={iconColor} strokeWidth={1.75} />
        </View>
        <Text className="text-[12.25px] font-medium text-[#0A0A0A] flex-1">
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
