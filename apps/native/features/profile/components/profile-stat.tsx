import { View, Text } from "react-native";
import { Icon } from "@/components/icon";
import { LucideIcon } from "lucide-react-native";

interface ProfileStatProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  value: string;
  label: string;
  sublabel: string;
}

export function ProfileStat({ 
  icon, 
  iconColor, 
  iconBgColor, 
  value, 
  label, 
  sublabel 
}: ProfileStatProps) {
  return (
    <View className="flex-1 items-center">
      <View className={`size-12 rounded-full ${iconBgColor} items-center justify-center mb-2`}>
        <Icon icon={icon} size={20} className={iconColor} />
      </View>
      <Text className="text-lg font-bold text-gray-900 text-center">
        {value}
      </Text>
      <Text className="text-sm font-normal text-gray-600 uppercase tracking-wider text-center">
        {label}
      </Text>
      <Text className="text-xs font-normal text-gray-400 text-center">
        {sublabel}
      </Text>
    </View>
  );
}
