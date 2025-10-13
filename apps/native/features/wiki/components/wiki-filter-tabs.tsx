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
    <View className="flex-row items-center gap-1.5 mb-7">
      <TouchableOpacity
        onPress={() => onTabChange("todos")}
        className={`flex-row items-center gap-2 px-3.5 py-2 rounded-full ${
          activeTab === "todos" ? "bg-primary" : "bg-gray-100"
        }`}
      >
        <Icon
          icon={BookOpen}
          size={14}
          className={activeTab === "todos" ? "text-white" : "text-gray-600"}
        />
        <Text
          className={`text-sm font-medium ${
            activeTab === "todos" ? "text-white" : "text-gray-600"
          }`}
        >
          Todos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onTabChange("favoritos")}
        className={`flex-row items-center gap-2 px-3.5 py-2 rounded-full ${
          activeTab === "favoritos" ? "bg-pink-500" : "bg-gray-100"
        }`}
      >
        <Icon
          icon={Heart}
          size={14}
          className={activeTab === "favoritos" ? "text-white" : "text-gray-600"}
        />
        <Text
          className={`text-sm font-medium ${
            activeTab === "favoritos" ? "text-white" : "text-gray-600"
          }`}
        >
          Favoritos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCategoriesPress}
        className={`flex-row items-center gap-2 px-3.5 py-2 rounded-full ${
          activeTab === "categorias" ? "bg-primary" : "bg-gray-100"
        }`}
      >
        <Icon
          icon={LayoutGrid}
          size={14}
          className={
            activeTab === "categorias" ? "text-white" : "text-gray-600"
          }
        />
        <Text
          className={`text-sm font-medium ${
            activeTab === "categorias" ? "text-white" : "text-gray-600"
          }`}
        >
          Categorias
        </Text>
        {selectedCategoriesCount > 0 && activeTab === "categorias" && (
          <View className="bg-white rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center ml-0.5">
            <Text className="text-primary text-[10px] font-bold">
              {selectedCategoriesCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
