import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Sparkles, ArrowLeft, Paperclip, Mic, Send } from "lucide-react-native";
import { Container } from "@/components/container";
import { useState, useEffect, useRef } from "react";
import { UserMessage, AiMessage } from "@/features/tutor-chat/components";

type Message = {
  id: string;
  type: "user" | "ai";
  content: string;
};

export default function TutorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const colorAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "Entendo sua dúvida sobre gestão de resíduos hospitalares. Para dar uma resposta mais precisa, você poderia fornecer mais detalhes? Por exemplo: qual tipo de resíduo (perfurocortante, químico, biológico)? Qual é o contexto específico?",
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const isInputEmpty = inputText.trim().length === 0;

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isInputEmpty ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isInputEmpty]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E5E7EB", "#155DFC"],
  });

  const iconColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#99A1AF", "#FFFFFF"],
  });

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

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center px-5">
              <View className="items-center gap-3.5">
                <View className="w-14 h-14 rounded-full bg-[#F9FAFB] items-center justify-center">
                  <Sparkles size={28} color="#99A1AF" />
                </View>

                <Text className="text-[17.5px] font-medium text-[#101828] text-center leading-snug tracking-tight">
                  Tutor de Resíduos Hospitalares
                </Text>

                <Text className="text-[12.25px] text-[#6A7282] text-center leading-[17.5px]">
                  Faça perguntas sobre classificação, descarte e gestão de
                  resíduos médicos
                </Text>
              </View>
            </View>
          ) : (
            <View className="gap-3.5">
              {messages.map((message) =>
                message.type === "user" ? (
                  <UserMessage key={message.id} message={message.content} />
                ) : (
                  <AiMessage key={message.id} message={message.content} />
                ),
              )}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="border-t border-gray-200 px-3.5 pb-2 pt-3">
          <View className="bg-[#F9FAFB] rounded-full border border-[#E5E7EB] flex-row items-center px-4 py-2">
            <TouchableOpacity className="w-8 h-8 rounded-full items-center justify-center">
              <Paperclip size={18} color="#6A7282" />
            </TouchableOpacity>

            <TextInput
              placeholder="Pergunte algo..."
              placeholderTextColor="#99A1AF"
              className="flex-1 text-base leading-tight text-neutral-900 px-2.5 py-1"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />

            <TouchableOpacity className="w-8 h-8 rounded-full items-center justify-center">
              <Mic size={18} color="#6A7282" />
            </TouchableOpacity>

            <TouchableOpacity disabled={isInputEmpty} onPress={handleSend}>
              <Animated.View
                className="w-7 h-7 rounded-full items-center justify-center ml-1"
                style={{ backgroundColor }}
              >
                <Animated.Text>
                  <Send
                    size={12}
                    color={isInputEmpty ? "#99A1AF" : "#FFFFFF"}
                    fill={isInputEmpty ? "#99A1AF" : "#FFFFFF"}
                  />
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
