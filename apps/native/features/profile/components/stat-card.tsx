import { View, Text } from "react-native";

interface StatCardProps {
  value: string;
  label: string;
  color?: string;
}

export function StatCard({ value, label, color = "#155DFC" }: StatCardProps) {
  return (
    <View className="bg-white border border-gray-100 rounded-xl px-3.5 py-3.5 shadow-sm flex-1">
      <Text className="text-xl font-semibold text-center mb-1" style={{ color }}>
        {value}
      </Text>
      <Text className="text-[10.5px] text-gray-500 text-center">
        {label}
      </Text>
    </View>
  );
}
