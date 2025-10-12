import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

interface UserMessageProps {
  message: string;
}

export function UserMessage({ message }: UserMessageProps) {
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
    <View style={styles.container}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        delayLongPress={500}
      >
        <View className="bg-primary rounded-lg px-4 py-3 max-w-[80%]">
          <Text className="text-balance text-base text-white">
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
  },
});

