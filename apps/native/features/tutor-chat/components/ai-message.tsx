import { View, Text, TouchableOpacity, Alert, Share } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

interface AiMessageProps {
  message: string;
}

export function AiMessage({ message }: AiMessageProps) {
  const router = useRouter();

  const handleLongPress = () => {
    Alert.alert(
      "Opções",
      "O que você deseja fazer?",
      [
        {
          text: "Copiar",
          onPress: async () => {
            await Clipboard.setStringAsync(message);
            Alert.alert("Copiado!", "Mensagem copiada para a área de transferência");
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
      { cancelable: true }
    );
  };

  return (
    <View className="flex-row justify-start px-3.5">
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        delayLongPress={500}
      >
        <View className="bg-[#F9FAFB] rounded-[14px] px-4 py-3 max-w-[70%]">
          <Text className="text-[15px] text-[#101828] leading-[24.38px]">
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
