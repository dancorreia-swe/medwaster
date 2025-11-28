import { View, Text, Image } from "react-native";
import { getUserInitials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

const textSizeClasses = {
  sm: "text-base",
  md: "text-[21px]",
  lg: "text-3xl",
};

export function UserAvatar({ 
  name, 
  imageUrl, 
  size = "md",
  showBadge = false 
}: UserAvatarProps) {
  return (
    <View className="flex-row items-center gap-3.5">
      <View className={`${sizeClasses[size]} rounded-full bg-gray-50 border-2 border-gray-200 items-center justify-center overflow-hidden`}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
            key={imageUrl}
          />
        ) : (
          <Text className={`${textSizeClasses[size]} font-bold text-gray-600`}>
            {getUserInitials(name)}
          </Text>
        )}
      </View>
      {showBadge && (
        <View className="w-5 h-5 rounded-full bg-blue-500 shadow-md items-center justify-center">
          <View className="w-2.5 h-2.5 rounded-full bg-white" />
        </View>
      )}
    </View>
  );
}
