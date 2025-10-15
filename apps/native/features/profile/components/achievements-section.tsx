import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { Icon } from "@/components/icon";

interface AchievementBadgeProps {
  emoji: string;
  label: string;
  isUnlocked: boolean;
  gradientColor?: string;
  onPress?: () => void;
}

function AchievementBadge({ 
  emoji, 
  label, 
  isUnlocked, 
  gradientColor = "#2B7FFF",
  onPress 
}: AchievementBadgeProps) {
  return (
    <TouchableOpacity 
      className="items-center gap-[7px]"
      onPress={onPress}
      style={{ width: 70 }}
    >
      <View 
        className={`w-[70px] h-[70px] rounded-full items-center justify-center border-[3.26px] ${
          isUnlocked ? "border-transparent" : "border-gray-200"
        }`}
        style={{ 
          backgroundColor: isUnlocked ? gradientColor : "#F3F4F6",
          opacity: isUnlocked ? 1 : 0.4 
        }}
      >
        <Text className="text-[26px]">{emoji}</Text>
      </View>
      <Text className="text-[10.5px] text-gray-600 text-center">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface AchievementsSectionProps {
  onViewAll: () => void;
}

export function AchievementsSection({ onViewAll }: AchievementsSectionProps) {
  return (
    <View className="bg-white px-5 py-5">
      <Text className="text-sm font-bold text-gray-900 mb-4">
        Minhas conquistas
      </Text>
      
      <View className="flex-row items-center gap-4">
        <AchievementBadge
          emoji="🎯"
          label="Iniciante"
          isUnlocked={true}
          gradientColor="#51A2FF"
        />
        <AchievementBadge
          emoji="🔍"
          label="Explorador"
          isUnlocked={false}
          gradientColor="#05DF72"
        />
        <AchievementBadge
          emoji="🔥"
          label="Persistente"
          isUnlocked={false}
          gradientColor="#FF8904"
        />
        <TouchableOpacity 
          className="items-center gap-[7px]"
          onPress={onViewAll}
          style={{ width: 70 }}
        >
          <View className="w-[70px] h-[70px] rounded-full bg-gray-100 items-center justify-center">
            <Icon icon={ChevronRight} size={28} className="text-gray-600" />
          </View>
          <Text className="text-[10.5px] text-gray-600 text-center">
            Ver todas
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
