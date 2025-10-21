import { View, TouchableOpacity, Text } from "react-native";
import { BookOpen, Heart, LayoutGrid } from "lucide-react-native";
import { Icon } from "@/components/icon";

type TabType = "todos" | "favoritos" | "categorias";

interface WikiFilterTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onCategoriesPress: () => void;
  selectedCategoriesCount: number;
}

export function WikiFilterTabs({
  activeTab,
  onTabChange,
  onCategoriesPress,
  selectedCategoriesCount,
}: WikiFilterTabsProps) {
  return (
    <View className="flex-row items-center gap-2.5 mb-7">
      <TouchableOpacity
        onPress={() => onTabChange("todos")}
        className={`flex-row items-center gap-2.5 px-4 py-2 rounded-full min-h-10 ${
          activeTab === "todos" ? "bg-primary" : "bg-gray-100"
        }`}
        accessibilityRole="button"
        accessibilityLabel="Ver todos os artigos"
        accessibilityState={{ selected: activeTab === "todos" }}
      >
        <Icon
          icon={BookOpen}
          size={18}
          className={activeTab === "todos" ? "text-white" : "text-gray-600"}
        />
        <Text
          className={`text-sm font-semibold ${
            activeTab === "todos" ? "text-white" : "text-gray-700"
          }`}
        >
          Todos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onTabChange("favoritos")}
        className={`flex-row items-center gap-2.5 px-4 py-2 rounded-full min-h-10 ${
          activeTab === "favoritos" ? "bg-pink-500" : "bg-pink-50"
        }`}
        accessibilityRole="button"
        accessibilityLabel="Ver artigos favoritos"
        accessibilityState={{ selected: activeTab === "favoritos" }}
      >
        <Icon
          icon={Heart}
          size={18}
          className={activeTab === "favoritos" ? "text-white" : "text-pink-600"}
        />
        <Text
          className={`text-sm font-semibold ${
            activeTab === "favoritos" ? "text-white" : "text-pink-700"
          }`}
        >
          Favoritos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCategoriesPress}
        className={`flex-row items-center gap-2.5 px-4 py-2 rounded-full min-h-10 ${
          activeTab === "categorias" ? "bg-purple-500" : "bg-purple-50"
        }`}
        accessibilityRole="button"
        accessibilityLabel={`Filtrar por categorias${selectedCategoriesCount > 0 ? `. ${selectedCategoriesCount} selecionadas` : ""}`}
        accessibilityState={{ selected: activeTab === "categorias" }}
      >
        <Icon
          icon={LayoutGrid}
          size={18}
          className={
            activeTab === "categorias" ? "text-white" : "text-purple-600"
          }
        />
        <Text
          className={`text-sm font-semibold ${
            activeTab === "categorias" ? "text-white" : "text-purple-700"
          }`}
        >
          Categorias
        </Text>
        {selectedCategoriesCount > 0 && (
          <View className={`rounded-full min-w-[24px] h-6 px-2 items-center justify-center ${
            activeTab === "categorias" ? "bg-white/20" : "bg-white"
          }`}>
            <Text className={`text-xs font-bold ${
              activeTab === "categorias" ? "text-white" : "text-purple-700"
            }`}>
              {selectedCategoriesCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
