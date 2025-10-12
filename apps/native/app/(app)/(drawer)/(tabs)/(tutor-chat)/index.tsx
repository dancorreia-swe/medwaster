import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Sparkles, ArrowLeft, Paperclip, Mic, Send } from "lucide-react-native";
import { Container } from "@/components/container";

export default function TutorScreen() {
  const router = useRouter();

  return (
    <Container className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
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
              Tutor AI
            </Text>
          </View>
        </View>

        {/* Main Content - Empty State */}
        <View className="flex-1 items-center justify-center px-5">
          <View className="items-center gap-3.5">
            {/* AI Icon */}
            <View className="w-14 h-14 rounded-full bg-[#F9FAFB] items-center justify-center">
              <Sparkles size={28} color="#99A1AF" />
            </View>

            <Text className="text-[17.5px] font-medium text-[#101828] text-center leading-snug tracking-tight">
              Tutor de Resíduos Hospitalares
            </Text>

            <Text className="text-[12.25px] text-[#6A7282] text-center leading-[17.5px]">
              Faça perguntas sobre classificação, descarte e gestão de resíduos
              médicos
            </Text>
          </View>
        </View>

        <View className="border-t border-gray-200 px-3.5 pb-2 pt-3">
          <View className="bg-[#F9FAFB] rounded-full border border-[#E5E7EB] flex-row items-center px-4 py-2">
            <TouchableOpacity className="w-8 h-8 rounded-full items-center justify-center">
              <Paperclip size={18} color="#6A7282" />
            </TouchableOpacity>

            <TextInput
              placeholder="Pergunte algo..."
              placeholderTextColor="#99A1AF"
              className="flex-1 text-base leading-tight text-neutral-900 px-2.5 py-1"
            />

            {/* Mic Button */}
            <TouchableOpacity className="w-8 h-8 rounded-full items-center justify-center">
              <Mic size={18} color="#6A7282" />
            </TouchableOpacity>

            <TouchableOpacity className="w-7 h-7 rounded-full bg-[#E5E7EB] items-center justify-center ml-1">
              <Send size={12} color="#99A1AF" fill="#99A1AF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
