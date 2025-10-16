import { View, Text, TouchableOpacity } from "react-native";
import { X, ChevronRight } from "lucide-react-native";
import { Icon } from "@/components/icon";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useCallback, useMemo, forwardRef, type Ref } from "react";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

interface CategoryFilterBottomSheetProps {
  selectedLevels: string[];
  onLevelToggle: (level: string) => void;
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}

const levels = ["Básico", "Intermediário", "Avançado"];

const categories = [
  { id: "quimicos", name: "Químicos", emoji: "🧪", count: 2 },
  { id: "infectantes", name: "Infectantes", emoji: "🦠", count: 1 },
  { id: "seguranca", name: "Segurança", emoji: "🛡️", count: 2 },
  { id: "emergencia", name: "Emergência", emoji: "🚨", count: 2 },
];

const CategoryFilterBottomSheetComponent = (
  {
    selectedLevels,
    onLevelToggle,
    selectedCategories,
    onCategoryToggle,
  }: CategoryFilterBottomSheetProps,
  ref: Ref<BottomSheet>,
) => {
  const snapPoints = useMemo(() => ["85%"], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: "#E5E7EB" }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
          <Text className="text-2xl font-semibold text-gray-900">
            Categorias
          </Text>

          <TouchableOpacity
            onPress={() => {
              if (ref && typeof ref !== "function" && ref.current) {
                ref.current.close();
              }
            }}
            className="w-8 h-8 rounded-full items-center justify-center"
          >
            <Icon icon={X} size={24} className="text-gray-900" />
          </TouchableOpacity>
        </View>

        {/* Level Filters */}
        <View className="px-5 py-4 border-b border-gray-50">
          <View className="flex-row items-center gap-1">
            {levels.map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => onLevelToggle(level)}
                className={`px-3.5 py-2 rounded-lg ${
                  selectedLevels.includes(level)
                    ? "bg-primary"
                    : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedLevels.includes(level)
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Filters */}
        <View className="px-5 flex-1">
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => onCategoryToggle(category.id)}
              className="mb-3.5"
            >
              <View
                className={`border rounded-xl px-3.5 py-3.5 ${
                  selectedCategories.includes(category.id)
                    ? "bg-primary/10 border-primary"
                    : "bg-white border-gray-100"
                }`}
              >
                <View className="flex-row items-center gap-3.5">
                  {/* Emoji Icon */}
                  <View
                    className={`size-12 rounded-xl items-center justify-center ${
                      selectedCategories.includes(category.id)
                        ? "bg-primary/20"
                        : "bg-gray-50"
                    }`}
                  >
                    <Text className="text-xl">{category.emoji}</Text>
                  </View>

                  {/* Content */}
                  <View className="flex-1 gap-0.5">
                    <Text
                      className={`text-sm font-semibold ${
                        selectedCategories.includes(category.id)
                          ? "text-primary"
                          : "text-gray-900"
                      }`}
                    >
                      {category.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {category.count}{" "}
                      {category.count === 1 ? "artigo" : "artigos"}
                    </Text>
                  </View>

                  {/* Checkmark or Chevron */}
                  {selectedCategories.includes(category.id) ? (
                    <View className="w-5 h-5 bg-primary rounded-full items-center justify-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  ) : (
                    <Icon
                      icon={ChevronRight}
                      size={17.5}
                      className="text-gray-900"
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export const CategoryFilterBottomSheet = forwardRef(
  CategoryFilterBottomSheetComponent,
);

CategoryFilterBottomSheet.displayName = "CategoryFilterBottomSheet";
