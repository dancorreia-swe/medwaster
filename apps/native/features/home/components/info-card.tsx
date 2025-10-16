import { Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  onPress?: () => void;
  className?: string;
}

interface InfoCardIconProps {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  size?: number;
  iconSize?: number;
}

interface InfoCardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface InfoCardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface InfoCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function InfoCard({ onPress, className, children }: InfoCardProps & { children: React.ReactNode }) {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component 
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      className={cn("bg-white rounded-lg p-3.5 shadow-sm shadow-black/15", className)}
    >
      {children}
    </Component>
  );
}

function InfoCardIcon({ 
  icon: Icon, 
  bgColor, 
  iconColor, 
  size = 35, 
  iconSize = 18 
}: InfoCardIconProps) {
  return (
    <View
      className="rounded-lg justify-center items-center"
      style={{ 
        backgroundColor: bgColor,
        width: size,
        height: size,
      }}
    >
      <Icon size={iconSize} color={iconColor} strokeWidth={1.5} />
    </View>
  );
}

function InfoCardContent({ children, className }: InfoCardContentProps) {
  return (
    <View className={cn("flex-1", className)}>
      {children}
    </View>
  );
}

function InfoCardTitle({ children, className }: InfoCardTitleProps) {
  return (
    <Text className={cn("text-sm font-medium text-gray-900", className)}>
      {children}
    </Text>
  );
}

function InfoCardDescription({ children, className }: InfoCardDescriptionProps) {
  return (
    <Text className={cn("text-xs text-gray-600 mt-0.5", className)}>
      {children}
    </Text>
  );
}

export {
  InfoCard,
  InfoCardIcon,
  InfoCardContent,
  InfoCardTitle,
  InfoCardDescription,
};
