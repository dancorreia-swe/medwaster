import { View, TouchableOpacity, Animated } from "react-native";
import {
  Headphones,
  Square,
  BookOpenCheck,
} from "lucide-react-native";

interface AudioControlFabProps {
  isReading: boolean;
  articleIsRead: boolean;
  fabTranslateY: Animated.Value;
  onAudioPress: () => void;
  onReadToggle: () => void;
}

export function AudioControlFab({
  isReading,
  articleIsRead,
  fabTranslateY,
  onAudioPress,
  onReadToggle,
}: AudioControlFabProps) {
  return (
    <Animated.View
      style={{
        transform: [{ translateY: fabTranslateY }],
        position: "absolute",
        bottom: 32,
        alignSelf: "center",
        borderRadius: 9999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 25,
      }}
    >
      <View className="flex-row items-center px-3 py-2.5 gap-2 bg-primary rounded-full">
        <TouchableOpacity
          onPress={onAudioPress}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            isReading ? "bg-red-500" : "bg-white/20"
          }`}
          accessibilityRole="button"
          accessibilityLabel={
            isReading ? "Parar leitura em áudio" : "Iniciar leitura em áudio"
          }
        >
          {isReading ? (
            <Square
              size={18}
              color="#FFFFFF"
              strokeWidth={2}
              fill="#FFFFFF"
            />
          ) : (
            <Headphones size={20} color="#FFFFFF" strokeWidth={2} />
          )}
        </TouchableOpacity>

        <View className="w-[1px] h-8 bg-white/20" />

        <TouchableOpacity
          onPress={onReadToggle}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            articleIsRead ? "bg-green-500/70" : "bg-white/20"
          }`}
          accessibilityRole="button"
          accessibilityLabel={
            articleIsRead ? "Marcar como não lido" : "Marcar como lido"
          }
        >
          <BookOpenCheck size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
