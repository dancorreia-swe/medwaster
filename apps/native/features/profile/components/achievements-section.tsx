import { View, Text, TouchableOpacity } from "react-native";
import { MoreHorizontal } from "lucide-react-native";
import { Icon } from "@/components/icon";
import { LinearGradient } from "expo-linear-gradient";

interface AchievementBadgeProps {
  emoji: string;
  label: string;
  isUnlocked: boolean;
  gradientColors?: string[];
  onPress?: () => void;
}

function AchievementBadge({
  emoji,
  label,
  isUnlocked,
  gradientColors = ["#2B7FFF", "#1E5FC7"],
  onPress,
}: AchievementBadgeProps) {
  const addOpacityToColor = (color: string, opacity: number) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const gradientColorsWithOpacity: [string, string] = [
    addOpacityToColor(gradientColors[0], 0.5),
    addOpacityToColor(gradientColors[1], 0.5),
  ];

  return (
    <TouchableOpacity
      className="items-center gap-2"
      onPress={onPress}
      style={{ width: 70 }}
    >
      {isUnlocked ? (
        <LinearGradient
          colors={gradientColorsWithOpacity}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "transparent",
          }}
        >
          <Text className="text-2xl">{emoji}</Text>
        </LinearGradient>
      ) : (
        <View
          className="size-20 rounded-full items-center justify-center border-2 border-gray-200"
          style={{
            backgroundColor: "#F3F4F6",
            opacity: 0.4,
          }}
        >
          <Text className="text-2xl">{emoji}</Text>
        </View>
      )}
      <Text className="text-sm text-gray-600 text-center">{label}</Text>
    </TouchableOpacity>
  );
}

interface AchievementsSectionProps {
  onViewAll: () => void;
}

export function AchievementsSection({ onViewAll }: AchievementsSectionProps) {
  return (
    <View className="bg-white px-5 py-5">
      <Text className="text-base font-bold text-gray-900 mb-4">
        Minhas conquistas
      </Text>

      <View className="flex-row items-center justify-between gap-4">
        <AchievementBadge
          emoji="🎯"
          label="Iniciante"
          isUnlocked={true}
          gradientColors={["#51A2FF", "#3B82F6", "#2563EB"]}
        />
        <AchievementBadge
          emoji="🔍"
          label="Explorador"
          isUnlocked={false}
          gradientColors={["#05DF72", "#10B981"]}
        />
        <AchievementBadge
          emoji="🔥"
          label="Persistente"
          isUnlocked={false}
          gradientColors={["#FF8904", "#F97316"]}
        />
        <TouchableOpacity
          className="items-center gap-[7px]"
          onPress={onViewAll}
          style={{ width: 70 }}
        >
          <View className="size-20 rounded-full bg-gray-100 items-center justify-center">
            <Icon icon={MoreHorizontal} size={28} className="text-gray-600" />
          </View>
          <Text className="text-sm text-gray-600 text-center">Ver todas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
