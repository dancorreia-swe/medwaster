import { View, TextInput } from "react-native";
import { Search } from "lucide-react-native";
import { Icon } from "@/components/icon";

interface WikiSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function WikiSearchBar({ value, onChangeText }: WikiSearchBarProps) {
  return (
    <View className="bg-white dark:bg-gray-900 rounded-2xl px-5 py-3.5 flex-row items-center gap-3 mb-0 shadow-sm shadow-black/15 dark:shadow-none border border-gray-100 dark:border-gray-800">
      <Icon icon={Search} size={20} className="text-gray-400 dark:text-gray-500" />
      <TextInput
        placeholder="Buscar artigos..."
        placeholderTextColor="#9CA3AF"
        className="flex-1 text-lg leading-tight text-gray-900 dark:text-gray-50"
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel="Campo de busca de artigos"
        accessibilityHint="Digite para buscar artigos na wiki"
      />
    </View>
  );
}
