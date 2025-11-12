import { View, Text, TouchableOpacity } from "react-native";
import { X, ChevronRight } from "lucide-react-native";
import { Icon } from "@/components/icon";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useCallback, useMemo, forwardRef, type Ref } from "react";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

interface CategorySummary {
  id: number;
  name: string;
  color: string;
  articleCount: number;
}

interface CategoryFilterBottomSheetProps {
  categories: CategorySummary[];
  selectedLevels: string[];
  onLevelToggle: (level: string) => void;
  selectedCategories: number[];
  onCategoryToggle: (categoryId: number) => void;
}

const levels = ["Básico", "Intermediário", "Avançado"];

function getCategoryInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

const CategoryFilterBottomSheetComponent = (
  {
    categories,
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

        <View className="px-5 py-4 border-b border-gray-50">
          <View className="flex-row items-center gap-1">
            {levels.map((level) => {
              const selected = selectedLevels.includes(level);
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => onLevelToggle(level)}
                  className={`px-3.5 py-2 rounded-lg ${
                    selected ? "bg-primary" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selected ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="px-5 flex-1">
          {categories.map((category) => {
            const selected = selectedCategories.includes(category.id);
            const initial = getCategoryInitial(category.name);
            const color = category.color || "#155DFC";
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => onCategoryToggle(category.id)}
                className="mb-3.5"
              >
                <View
                  className={`border rounded-xl px-3.5 py-3.5 ${
                    selected
                      ? "bg-primary/10 border-primary"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <View className="flex-row items-center gap-3.5">
                    <View
                      className={`size-12 rounded-xl items-center justify-center ${
                        selected ? "bg-primary/20" : "bg-gray-50"
                      }`}
                    >
                      <Text
                        className="text-lg font-semibold"
                        style={{ color }}
                      >
                        {initial}
                      </Text>
                    </View>

                    <View className="flex-1 gap-0.5">
                      <Text
                        className={`text-sm font-semibold ${
                          selected ? "text-primary" : "text-gray-900"
                        }`}
                      >
                        {category.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {category.articleCount}{" "}
                        {category.articleCount === 1 ? "artigo" : "artigos"}
                      </Text>
                    </View>

                    {selected ? (
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
            );
          })}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export const CategoryFilterBottomSheet = forwardRef(
  CategoryFilterBottomSheetComponent,
);

CategoryFilterBottomSheet.displayName = "CategoryFilterBottomSheet";
