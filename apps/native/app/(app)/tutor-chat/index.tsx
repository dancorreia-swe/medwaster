import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Route, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Mic,
  Send,
  GraduationCap,
  Square,
} from "lucide-react-native";
import { Container } from "@/components/container";
import { useState, useEffect, useRef } from "react";
import { UserMessage, AiMessage } from "@/features/tutor-chat/components";
import { Icon } from "@/components/icon";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import { authClient } from "@/lib/auth-client";

export default function TutorScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: Route }>();

  const [inputText, setInputText] = useState("");
  const [prevIsEmpty, setPrevIsEmpty] = useState(true);
  const [cancelledMessageId, setCancelledMessageId] = useState<string | null>(
    null,
  );
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleBack = () => {
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.push("/(app)/(tabs)");
    }
  };

  const cookies = authClient.getCookie();
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: process.env.EXPO_PUBLIC_SERVER_URL + "/ai/chat",
      headers: {
        Cookie: cookies,
      },
    }),
    onError: (error) => console.error(error, "ERROR"),
    onFinish: ({ isAbort, message }) => {
      if (isAbort) {
        setCancelledMessageId(message.id);
      }
    },
  });

  const handleStop = () => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        setCancelledMessageId(lastMessage.id);
      }
    }

    stop();
  };

  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    setCancelledMessageId(null);
    sendMessage({ text: inputText });
    setInputText("");
  };

  const isInputEmpty = inputText.trim().length === 0;

  useEffect(() => {
    if (prevIsEmpty !== isInputEmpty) {
      setPrevIsEmpty(isInputEmpty);

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start();
    }
  }, [isInputEmpty, prevIsEmpty]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages]);

  useEffect(() => {
    if (status === "streaming") {
      const interval = setInterval(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <Container className="flex-1 bg-white" edges={["top", "bottom"]}>
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
        className="flex-1 h-auto"
        contentContainerStyle={
          messages.length === 0 ? { flex: 1 } : undefined
        }
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (status === "streaming" || status === "submitted") {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }
        }}
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
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isCurrentlyStreaming =
                isLastMessage && status === "streaming";

              const isCancelled = message.id === cancelledMessageId;

              if (message.role === "user") {
                return (
                  <UserMessage
                    key={message.id}
                    message={message.parts
                      .map((part) => (part.type === "text" ? part.text : ""))
                      .join("")}
                    />
                );
              }

              const messageText = message.parts
                .map((part) => (part.type === "text" ? part.text : ""))
                .join("");

              return (
                <AiMessage
                  key={message.id}
                  message={messageText.trim() === "" ? null : messageText}
                  isStreaming={isCurrentlyStreaming}
                  isCancelled={isCancelled}
                />
              );
            })}

            {status === "submitted" && (
              <View className="px-4 py-3 gap-3">
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="rgb(21, 93, 252)" />
                  <Text className="text-sm text-gray-500">Pensando...</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View className="px-3.5 pb-2 pt-3">
          <View className="flex-row items-end justify-end gap-2">
            <View className="flex-1 bg-gray-50 rounded-3xl border border-gray-200 px-4 py-2">
              {/* <TouchableOpacity className="w-8 h-8 rounded-full items-center justify-center mb-1"> */}
              {/*   <Paperclip size={18} className="text-gray-500" /> */}
              {/* </TouchableOpacity> */}

              <TextInput
                placeholder="Pergunte algo..."
                className="text-lg leading-tight text-neutral-900 px-2.5 py-2 placeholder:text-muted-foreground/80"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                multiline
                maxLength={500}
                style={{ maxHeight: 120 }}
                textAlignVertical="top"
              />
            </View>

            {status === "submitted" || status === "streaming" ? (
              <TouchableOpacity
                onPress={handleStop}
                disabled={!(status === "submitted" || status === "streaming")}
                className="mb-1"
              >
                <View className="size-14 rounded-full items-center justify-center bg-gray-700">
                  <Icon
                    icon={Square}
                    size={14}
                    className="text-white fill-white"
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={isInputEmpty ? undefined : handleSend}
                disabled={!(status === "ready")}
                className="mb-1 disabled:opacity-50"
              >
                <View className="size-14 rounded-full items-center justify-center bg-primary">
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    {isInputEmpty ? (
                      <Icon icon={Mic} size={20} className="text-white" />
                    ) : (
                      <Icon
                        icon={Send}
                        size={16}
                        className="text-white fill-white"
                      />
                    )}
                  </Animated.View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
