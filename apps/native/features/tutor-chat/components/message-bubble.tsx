import { View, TouchableOpacity, Alert, Share, Animated } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useMarkdown } from "react-native-marked";
import { useRef, useMemo } from "react";

interface MessageBubbleProps {
  message: string;
  isUser?: boolean;
}

export function MessageBubble({ message, isUser = false }: MessageBubbleProps) {
  const router = useRouter();
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const colors = useMemo(
    () => ({
      text: isUser ? "#FFFFFF" : "#101828",
      link: isUser ? "#FFFFFF" : "#3B82F6",
      code: isUser ? "#FFFFFF" : "#101828",
      border: isUser ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.1)",
      background: isUser ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.05)",
      overlay: isUser ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.05)",
    }),
    [isUser],
  );

  const elements = useMarkdown(message, {
    theme: { colors },
    styles: {
      text: {
        fontSize: 16,
        lineHeight: 24,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 0,
      },
      list: {
        marginTop: 0,
        marginBottom: 0,
        paddingBottom: 16,
      },
      li: {
        marginBottom: 0,
        marginTop: 0,
      },
    },
  });

  const handleLongPress = () => {
    Alert.alert(
      "Opções",
      "O que você deseja fazer?",
      [
        {
          text: "Copiar",
          onPress: async () => {
            await Clipboard.setStringAsync(message);
            Alert.alert(
              "Copiado!",
              "Mensagem copiada para a área de transferência",
            );
          },
        },
        {
          text: "Selecionar texto",
          onPress: () => {
            router.push({
              pathname: "/(app)/(drawer)/(tabs)/(tutor-chat)/text-viewer",
              params: { text: message },
            });
          },
        },
        {
          text: "Compartilhar",
          onPress: async () => {
            try {
              await Share.share({
                message: message,
              });
            } catch (error) {
              console.error(error);
            }
          },
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  const animatePress = (toValue: number) => {
    Animated.timing(opacityAnim, {
      toValue,
      duration: toValue === 1 ? 100 : 200,
      useNativeDriver: true,
    }).start();
  };

  const containerClass = `flex-row px-3.5 ${isUser ? "justify-end" : "justify-start"}`;

  const bubbleClass = `px-4 py-1 relative overflow-hidden rounded-lg ${
    isUser ? "bg-primary" : "bg-[#F9FAFB]"
  }`;

  return (
    <View className={containerClass}>
      <View className="max-w-[85%]">
        <TouchableOpacity
          onLongPress={handleLongPress}
          onPressIn={() => animatePress(1)}
          onPressOut={() => animatePress(0)}
          activeOpacity={1}
          delayLongPress={500}
        >
          <View className={bubbleClass}>
            <Animated.View
              className="absolute inset-0"
              style={{
                backgroundColor: colors.overlay,
                opacity: opacityAnim,
              }}
            />
            {elements}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
