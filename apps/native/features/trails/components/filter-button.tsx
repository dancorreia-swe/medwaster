import { TouchableOpacity, Text, View } from "react-native";

interface FilterButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
}

export function FilterButton({ label, count, isActive, onPress }: FilterButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-2 px-3.5 py-2 rounded-full ${
        isActive ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <Text
        className={`text-xs font-medium ${
          isActive ? "text-white" : "text-gray-900"
        }`}
      >
        {label}
      </Text>
      <View
        className={`px-1.5 py-0.5 rounded-full min-w-[21px] items-center justify-center ${
          isActive ? "bg-white/20" : "bg-white"
        }`}
      >
        <Text
          className={`text-[10.5px] font-bold ${
            isActive ? "text-white" : "text-gray-900"
          }`}
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
