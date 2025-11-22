import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { X, Check } from "lucide-react-native";
import { Icon } from "@/components/icon";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useCallback, useMemo, forwardRef, type Ref } from "react";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useColorScheme } from "@/lib/use-color-scheme";

interface CategorySummary {
  id: number;
  name: string;
  color: string;
  articleCount: number;
}

interface CategoryFilterBottomSheetProps {
  categories: CategorySummary[];
  selectedCategories: number[];
  onCategoryToggle: (categoryId: number) => void;
}

function getCategoryInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

const CategoryFilterBottomSheetComponent = (
  {
    categories,
    selectedCategories,
    onCategoryToggle,
  }: CategoryFilterBottomSheetProps,
  ref: Ref<BottomSheet>,
) => {
  const snapPoints = useMemo(() => ["75%"], []);
  const { isDarkColorScheme } = useColorScheme();
  const sheetBackground = isDarkColorScheme ? "#0f172a" : "#ffffff";
  const indicatorColor = isDarkColorScheme ? "#374151" : "#d1d5db";

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

  const selectedCount = selectedCategories.length;

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: sheetBackground }}
      handleIndicatorStyle={{ backgroundColor: indicatorColor }}
    >
      <BottomSheetView style={{ flex: 1, backgroundColor: sheetBackground }}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-gray-50">
                Filtrar por Categoria
              </Text>
              {selectedCount > 0 && (
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedCount} {selectedCount === 1 ? "selecionada" : "selecionadas"}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                if (ref && typeof ref !== "function" && ref.current) {
                  ref.current.close();
                }
              }}
              className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
            >
              <Icon icon={X} size={20} className="text-gray-600 dark:text-gray-400" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories List */}
        <ScrollView
          className="flex-1 px-6 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            const initial = getCategoryInitial(category.name);
            const color = category.color || "#155DFC";

            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => onCategoryToggle(category.id)}
                activeOpacity={0.7}
                className="mb-3"
              >
                <View
                  className={`rounded-2xl p-4 border-2 ${
                    isSelected
                      ? "bg-primary/5 border-primary dark:bg-primary/10"
                      : "bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-gray-800"
                  }`}
                >
                  <View className="flex-row items-center gap-4">
                    {/* Category Icon */}
                    <View
                      className="w-14 h-14 rounded-xl items-center justify-center"
                      style={{
                        backgroundColor: isSelected
                          ? `${color}20`
                          : isDarkColorScheme ? "#1f2937" : "#ffffff"
                      }}
                    >
                      <Text
                        className="text-xl font-bold"
                        style={{ color }}
                      >
                        {initial}
                      </Text>
                    </View>

                    {/* Category Info */}
                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold mb-1 ${
                          isSelected
                            ? "text-primary"
                            : "text-gray-900 dark:text-gray-50"
                        }`}
                      >
                        {category.name}
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400">
                        {category.articleCount} {category.articleCount === 1 ? "artigo" : "artigos"}
                      </Text>
                    </View>

                    {/* Checkmark */}
                    {isSelected && (
                      <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                        <Icon icon={Check} size={14} className="text-white" />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

export const CategoryFilterBottomSheet = forwardRef(
  CategoryFilterBottomSheetComponent,
);

CategoryFilterBottomSheet.displayName = "CategoryFilterBottomSheet";
