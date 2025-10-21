import { TouchableOpacity, Text, View } from "react-native";

interface FilterButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
  variant?: "default" | "progress" | "available" | "completed";
}

const filterVariants = {
  default: {
    active: "bg-primary",
    inactive: "bg-gray-100",
    activeText: "text-white",
    inactiveText: "text-gray-700",
  },
  progress: {
    active: "bg-orange-500",
    inactive: "bg-orange-50",
    activeText: "text-white",
    inactiveText: "text-orange-700",
  },
  available: {
    active: "bg-blue-500",
    inactive: "bg-blue-50",
    activeText: "text-white",
    inactiveText: "text-blue-700",
  },
  completed: {
    active: "bg-green-500",
    inactive: "bg-green-50",
    activeText: "text-white",
    inactiveText: "text-green-700",
  },
};

export function FilterButton({
  label,
  count,
  isActive,
  onPress,
  variant = "default",
}: FilterButtonProps) {
  const colors = filterVariants[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-2.5 px-4 py-2 rounded-full min-h-10 ${
        isActive ? colors.active : colors.inactive
      }`}
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${label}. ${count} ${count === 1 ? "trilha" : "trilhas"}`}
      accessibilityState={{ selected: isActive }}
    >
      <Text
        className={`text-sm font-semibold ${
          isActive ? colors.activeText : colors.inactiveText
        }`}
      >
        {label}
      </Text>
      <View
        className={`px-2 py-1 rounded-full min-w-[24px] items-center justify-center ${
          isActive ? "bg-white/20" : "bg-white"
        }`}
      >
        <Text
          className={`text-xs font-bold ${
            isActive ? colors.activeText : colors.inactiveText
          }`}
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
