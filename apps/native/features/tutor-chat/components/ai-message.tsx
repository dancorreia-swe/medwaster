import { MessageBubble } from "./message-bubble";
import { View, Animated, Text, TouchableOpacity } from "react-native";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/icon";
import { Pause, Play, Square, Volume2 } from "lucide-react-native";

interface AiMessageProps {
  message: string | null;
  isStreaming?: boolean;
  isCancelled?: boolean;
  canPlayAudio?: boolean;
  isAudioActive?: boolean;
  isAudioPaused?: boolean;
  onAudioPress?: () => void;
  onAudioPauseResume?: () => void;
}

function LoadingDots() {
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dotAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const animation = Animated.parallel([
      animateDot(dotAnim1, 0),
      animateDot(dotAnim2, 200),
      animateDot(dotAnim3, 400),
    ]);

    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <View className="flex-row items-center gap-1 py-1">
      <Animated.View
        style={{
          opacity: dotAnim1.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        }}
      >
        <View className="w-2 h-2 rounded-full bg-gray-400" />
      </Animated.View>
      <Animated.View
        style={{
          opacity: dotAnim2.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        }}
      >
        <View className="w-2 h-2 rounded-full bg-gray-400" />
      </Animated.View>
      <Animated.View
        style={{
          opacity: dotAnim3.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        }}
      >
        <View className="w-2 h-2 rounded-full bg-gray-400" />
      </Animated.View>
    </View>
  );
}

export function AiMessage({
  message,
  isStreaming,
  isCancelled,
  canPlayAudio,
  isAudioActive,
  isAudioPaused,
  onAudioPress,
  onAudioPauseResume,
}: AiMessageProps) {
  if (message === null || (message.trim() === "" && isStreaming)) {
    return (
      <View className="px-4">
        <View className="px-4 py-3 max-w-[85%]">
          <LoadingDots />
        </View>
      </View>
    );
  }

  return (
    <View>
      <MessageBubble message={message} isUser={false} />
      {canPlayAudio && onAudioPress && (
        <View className="px-4 mt-2 flex-row items-center gap-2">
          <TouchableOpacity
            onPress={onAudioPress}
            className="flex-row items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-2"
            activeOpacity={0.9}
          >
            <Icon
              icon={isAudioActive ? Square : Volume2}
              size={16}
              className="text-gray-700 dark:text-gray-100"
            />
            <Text className="text-sm text-gray-700 dark:text-gray-100">
              {isAudioActive ? "Parar áudio" : "Ouvir"}
            </Text>
          </TouchableOpacity>

          {isAudioActive && onAudioPauseResume && (
            <TouchableOpacity
              onPress={onAudioPauseResume}
              className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center"
              activeOpacity={0.9}
            >
              <Icon
                icon={isAudioPaused ? Play : Pause}
                size={16}
                className="text-gray-700 dark:text-gray-100"
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      {isCancelled && (
        <View className="px-4 mt-1">
          <Text className="text-xs text-gray-400 italic">
            Resposta incompleta (cancelada)
          </Text>
        </View>
      )}
    </View>
  );
}
