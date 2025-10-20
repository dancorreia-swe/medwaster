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
import { Href, Route, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Mic, Send, GraduationCap } from "lucide-react-native";
import { Container } from "@/components/container";
import { useState, useEffect, useRef } from "react";
import { UserMessage, AiMessage } from "@/features/tutor-chat/components";
import { Icon } from "@/components/icon";

type MessageType = "user" | "ai";

type Message = {
  id: string;
  type: MessageType;
  content: string;
};

export default function TutorScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: Route }>();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const colorAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleBack = () => {
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.push("/(app)/(drawer)/(tabs)");
    }
  };

  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `Entendo sua dúvida sobre gestão de resíduos hospitalares.
## Para dar uma resposta mais precisa,
você poderia fornecer mais detalhes? 
Por exemplo:
- qual tipo de resíduo (perfurocortante, químico, biológico)? 
- Qual é o contexto específico?`,
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
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgb(229, 231, 235)", "rgb(21, 93, 252)"], // gray-200 to primary
  });

  return (
    <Container className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="border-b border-gray-200 px-4 pt-3.5 pb-3">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={handleBack}
              className="rounded-full items-center justify-center"
            >
              <Icon icon={ArrowLeft} size={24} className="text-neutral-600" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2.5">
              <Text className="text-4xl font-bold text-gray-900 leading-tight">
                Tutor
              </Text>
              <Text className="text-4xl font-light text-gray-400 leading-tight">
                AI
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerClassName={
            messages.length === 0 ? "flex-1" : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center px-5">
              <View className="items-center gap-3.5">
                <View className="w-14 h-14 rounded-full bg-secondary items-center justify-center">
                  <Icon
                    icon={GraduationCap}
                    size={28}
                    className="text-primary"
                  />
                </View>

                <Text className="text-2xl font-medium text-gray-900 text-center leading-snug tracking-tight">
                  Tutor Medwaster
                </Text>

                <Text className="text-base text-gray-500 text-center leading-tight px-4">
                  Faça perguntas sobre classificação, descarte e gestão de
                  resíduos médicos.
                </Text>
              </View>
            </View>
          ) : (
            <View className="gap-3.5 py-5">
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
          <View className="bg-gray-50 rounded-full border border-gray-200 flex-row items-center px-4 py-2">
            {/* <TouchableOpacity className="w-8 h-8 rounded-full items-center justify-center"> */}
            {/*   <Paperclip size={18} className="text-gray-500" /> */}
            {/* </TouchableOpacity> */}

            <TextInput
              placeholder="Pergunte algo..."
              className="flex-1 text-base leading-tight text-neutral-900 px-2.5 py-1 placeholder:text-muted-foreground/80"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />

            <TouchableOpacity className="size-8 rounded-full items-center justify-center">
              <Icon icon={Mic} size={18} className="text-muted-foreground" />
            </TouchableOpacity>

            <TouchableOpacity disabled={isInputEmpty} onPress={handleSend}>
              <Animated.View
                className="size-8 rounded-full items-center justify-center ml-1"
                style={{ backgroundColor }}
              >
                <Animated.Text>
                  <Icon
                    icon={Send}
                    size={12}
                    className={
                      isInputEmpty
                        ? "text-muted-foreground fill-muted-foreground"
                        : "text-white fill-white"
                    }
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
