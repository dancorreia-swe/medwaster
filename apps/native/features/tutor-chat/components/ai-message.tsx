import { MessageBubble } from "./message-bubble";
import { View, Animated, Text } from "react-native";
import { useEffect, useRef } from "react";

interface AiMessageProps {
  message: string | null;
  isStreaming?: boolean;
  isCancelled?: boolean;
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
