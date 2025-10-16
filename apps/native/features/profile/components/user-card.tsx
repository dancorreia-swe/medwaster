import { View, Text } from "react-native";

interface UserCardProps {
  name: string;
  avatar: React.ReactNode;
}

export function UserCard({ name, avatar }: UserCardProps) {
  return (
    <View className="mx-0 border-b border-gray-100">
      <View className="px-5 pb-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[21px] font-bold text-gray-900">
            {name}
          </Text>
          {avatar}
        </View>
      </View>
    </View>
  );
}
