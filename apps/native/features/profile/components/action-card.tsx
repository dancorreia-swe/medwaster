import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "@/components/icon";
import { ChevronRight, LucideIcon } from "lucide-react-native";

interface ActionCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  title: string;
  description: string;
  onPress: () => void;
}

export function ActionCard({ 
  icon, 
  iconColor, 
  iconBgColor, 
  title, 
  description, 
  onPress 
}: ActionCardProps) {
  return (
    <TouchableOpacity 
      className="bg-white rounded-xl border border-gray-100 shadow-sm shadow-black/15"
      onPress={onPress}
    >
      <View className="p-3.5 flex-row items-center gap-3.5">
        <View className={`size-42 rounde-full ${iconBgColor} items-center justify-center`}>
          <Icon icon={icon} size={21} className={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900 mb-0.5">
            {title}
          </Text>
          <Text className="text-sm text-gray-600">
            {description}
          </Text>
        </View>
        <Icon icon={ChevronRight} size={17.5} className="text-gray-400" />
      </View>
    </TouchableOpacity>
  );
}
