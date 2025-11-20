import { TouchableOpacity, Animated } from "react-native";
import { useColorScheme } from "@/lib/use-color-scheme";
import { Play, Pause } from "lucide-react-native";

interface PauseButtonProps {
  isReading: boolean;
  isPaused: boolean;
  pauseButtonTranslateY: Animated.Value;
  pauseButtonScale: Animated.Value;
  onPress: () => void;
}

export function PauseButton({
  isReading,
  isPaused,
  pauseButtonTranslateY,
  pauseButtonScale,
  onPress,
}: PauseButtonProps) {
  const { isDarkColorScheme } = useColorScheme();
  const backgroundColor = isDarkColorScheme ? "#1d4ed8" : "#3B82F6";

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: pauseButtonTranslateY },
          { scale: pauseButtonScale },
        ],
        opacity: pauseButtonScale,
        position: "absolute",
        bottom: 35,
        left: 24,
        backgroundColor,
        borderRadius: 9999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDarkColorScheme ? 0.35 : 0.25,
        shadowRadius: 25,
        elevation: 25,
      }}
      pointerEvents={isReading ? "auto" : "none"}
    >
      <TouchableOpacity
        onPress={onPress}
        className="w-14 h-14 rounded-full items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={isPaused ? "Retomar leitura" : "Pausar leitura"}
      >
        {isPaused ? (
          <Play size={24} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
        ) : (
          <Pause size={24} color="#FFFFFF" strokeWidth={2} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
