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
      className="bg-white rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="p-5 flex-row items-center gap-4">
        <View className={`w-14 h-14 rounded-xl ${iconBgColor} items-center justify-center`}>
          <Icon icon={icon} size={24} className={iconColor} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
            {title}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 leading-5">
            {description}
          </Text>
        </View>
        <Icon icon={ChevronRight} size={20} className="text-gray-400 dark:text-gray-500" />
      </View>
    </TouchableOpacity>
  );
}
