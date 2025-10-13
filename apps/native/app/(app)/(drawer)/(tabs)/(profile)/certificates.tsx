import { View, Text } from "react-native";
import { Container } from "@/components/container";

export default function CertificatesScreen() {
  return (
    <Container className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold">Meus Certificados</Text>
        <Text className="text-gray-600 mt-2">Coming soon...</Text>
      </View>
    </Container>
  );
}
