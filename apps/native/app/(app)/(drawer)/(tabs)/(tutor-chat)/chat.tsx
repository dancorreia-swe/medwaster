import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Container } from "@/components/container";

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const handleBack = () => {
    const lastTab = params.lastTab as string || "index";
    router.replace(`/(app)/(drawer)/(tabs)/${lastTab}`);
  };

  return (
    <Container className="flex-1 bg-white">
      <View className="border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={handleBack}
            className="w-9 h-9 items-center justify-center -ml-2"
          >
            <ArrowLeft size={24} color="#101828" strokeWidth={2} />
          </TouchableOpacity>

          <Text className="text-[17px] font-semibold text-[#101828]">
            Chat with AI
          </Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">This is a stacked screen!</Text>
      </View>
    </Container>
  );
}
