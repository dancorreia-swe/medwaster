import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Container } from "@/components/container";

export default function TextViewer() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const text = params.text as string;

  return (
    <Container className="flex-1 bg-white">
      {/* Header */}
      <View className="border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 items-center justify-center -ml-2"
          >
            <ArrowLeft size={24} color="#101828" strokeWidth={2} />
          </TouchableOpacity>

          <Text className="text-[17px] font-semibold text-[#101828]">
            Selecionar texto
          </Text>
        </View>
      </View>

      {/* Text Content */}
      <ScrollView className="flex-1 px-5 py-6">
        <Text 
          className="text-[15px] text-[#101828] leading-[24.38px]"
          selectable={true}
        >
          {text}
        </Text>
      </ScrollView>
    </Container>
  );
}
