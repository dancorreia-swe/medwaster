import { View, TextInput } from "react-native";
import { Search } from "lucide-react-native";
import { Icon } from "@/components/icon";

interface WikiSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function WikiSearchBar({ value, onChangeText }: WikiSearchBarProps) {
  return (
    <View className="bg-gray-50 rounded-full px-4 py-2.5 flex-row items-center gap-2 mb-0">
      <TextInput
        placeholder="Buscar artigos..."
        placeholderTextColor="#99A1AF"
        className="flex-1 text-[15px] text-gray-900"
        value={value}
        onChangeText={onChangeText}
      />
      <Icon icon={Search} size={17.5} className="text-gray-400" />
    </View>
  );
}
