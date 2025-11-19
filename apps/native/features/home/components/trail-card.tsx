import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Clock, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface TrailCardProps {
  title: string;
  category: string;
  duration: string;
  gradientColors: [string, string];
  categoryBg: string;
  status: "new" | "progress" | "recommended";
  progress?: number;
  onPress?: () => void;
}

export function TrailCard({
  title,
  category,
  duration,
  gradientColors,
  categoryBg,
  status,
  progress,
  onPress,
}: TrailCardProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-[12.75px] shadow-sm shadow-black/15"
      style={{ width: 280 }}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        {/* Content */}
        <View>
          <View 
            className="px-2 py-1 rounded-md self-start mb-2"
            style={{ backgroundColor: categoryBg }}
          >
            <Text className="text-[10.5px] font-medium text-white">
              {category}
            </Text>
          </View>
          <Text className="text-base font-semibold text-white leading-5 pr-8">
            {title}
          </Text>
        </View>

        {/* Duration */}
        <View className="flex-row items-center gap-[7px]">
          <Clock size={14} color="rgba(255, 255, 255, 0.9)" strokeWidth={1.5} />
          <Text className="text-xs text-white/90">{duration}</Text>
        </View>
      </LinearGradient>

      {/* Card Footer */}
      <View className="px-3.5 py-3">
        {status === "progress" ? (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-gray-600">
                Procedimentos de emergência
              </Text>
              <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
            </View>
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[10.5px] text-gray-500">Progresso</Text>
              <Text className="text-[10.5px] font-semibold text-primary">
                {progress}%
              </Text>
            </View>
            <View className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-600 flex-1">
              Comece esta trilha de aprendizado
            </Text>
            <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    height: 140,
    borderTopLeftRadius: 12.75,
    borderTopRightRadius: 12.75,
    padding: 20,
    justifyContent: 'space-between',
  },
});
