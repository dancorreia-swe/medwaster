import { View, Text } from "react-native";

interface ProfileHeaderProps {
  name: string;
  role: string;
  initial: string;
}

export function ProfileHeader({ name, role, initial }: ProfileHeaderProps) {
  return (
    <View className="bg-gradient-to-br from-primary via-blue-500 to-cyan-400 px-5 pb-0">
      <View className="items-center pt-5 pb-8">
        {/* Avatar */}
        <View className="w-21 h-21 bg-white/90 rounded-full items-center justify-center shadow-lg mb-4">
          <Text className="text-primary text-[21px] font-normal">{initial}</Text>
        </View>
        
        {/* Name */}
        <Text className="text-white text-lg font-semibold mb-1">
          {name}
        </Text>
        
        {/* Role */}
        <Text className="text-white/80 text-xs">
          {role}
        </Text>
      </View>
    </View>
  );
}
