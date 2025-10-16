import { View, Text, TouchableOpacity } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { Icon } from "@/components/icon";
import { ChevronRight } from "lucide-react-native";

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

export function MenuItem({ 
  icon, 
  label, 
  onPress, 
  showArrow = true,
  danger = false 
}: MenuItemProps) {
  return (
    <>
      <TouchableOpacity 
        onPress={onPress}
        className="flex-row items-center justify-between py-3.5"
      >
        <View className="flex-row items-center gap-2.5">
          <Icon 
            icon={icon} 
            size={17.5} 
            className={danger ? "text-red-600" : "text-gray-500"}
          />
          <Text className={`text-xs font-medium ${danger ? "text-red-600" : "text-gray-900"}`}>
            {label}
          </Text>
        </View>
        {showArrow && (
          <View className="w-1.5 h-1.5 bg-gray-400/40 rounded-full" />
        )}
      </TouchableOpacity>
      <View className="h-px bg-gray-100" />
    </>
  );
}
