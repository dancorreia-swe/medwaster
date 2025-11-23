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
  Image,
  Alert,
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
import { useState, useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import { UserMessage, AiMessage } from "@/features/tutor-chat/components";
import { Icon } from "@/components/icon";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import { authClient } from "@/lib/auth-client";
import * as Speech from "expo-speech";

import graduationHatIcon from "@/assets/graduation.png";

export default function TutorScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: Route }>();

  const [inputText, setInputText] = useState("");
  const [prevIsEmpty, setPrevIsEmpty] = useState(true);
  const [cancelledMessageId, setCancelledMessageId] = useState<string | null>(
    null,
  );
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const stopRequestedRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

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
    onError: (error) => {
      stopRequestedRef.current = false;
      console.error(error, "ERROR");
    },
    onFinish: ({ isAbort, message }) => {
      if ((isAbort || stopRequestedRef.current) && message?.id) {
        setCancelledMessageId(message.id);
      }
      stopRequestedRef.current = false;
    },
  });

  const getMessageText = useCallback(
    (message: (typeof messages)[number]) =>
      message.parts
        .map((part) => (part.type === "text" ? part.text : ""))
        .join("")
        .trim(),
    [messages],
  );

  const stopSpeech = useCallback(async () => {
    await Speech.stop();
    setSpeakingMessageId(null);
    setIsAudioPaused(false);
  }, []);

  const handleStop = () => {
    if (!(status === "submitted" || status === "streaming")) return;

    stopRequestedRef.current = true;

    const lastAssistant = [...messages]
      .reverse()
      .find((msg) => msg.role === "assistant");
    if (lastAssistant) {
      setCancelledMessageId(lastAssistant.id);
    }

    stopSpeech();
    stop?.();
  };

  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    setCancelledMessageId(null);
    stopSpeech();
    sendMessage({ text: inputText });
    setInputText("");
  };

  const transcribeAndSend = useCallback(
    async (uri: string) => {
      try {
        setIsTranscribing(true);
        const fileResponse = await fetch(uri);
        const blob = await fileResponse.blob();

        const mimeType =
          blob.type === "audio/x-m4a"
            ? "audio/m4a"
            : blob.type || "audio/m4a";
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result?.toString() ?? "";
            resolve(
              result.startsWith("data:")
                ? result
                : `data:${mimeType};base64,${result}`,
            );
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        console.log("[tutor-chat] Uploading audio", {
          mimeType,
          blobType: blob.type,
          size: blob.size,
          preview: base64.slice(0, 32),
        });

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SERVER_URL}/ai/transcribe`,
          {
            method: "POST",
            headers: {
              Cookie: cookies,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ audio: base64, mimeType }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Transcription failed with status ${response.status}`,
          );
        }

        const data = (await response.json()) as { text?: string };
        const transcript = data.text?.trim() ?? "";

        if (!transcript) {
          Alert.alert("Não foi possível transcrever o áudio.");
          return;
        }

        setCancelledMessageId(null);
        stopSpeech();
        sendMessage({ text: transcript });
      } catch (error) {
        console.error(error);
        Alert.alert(
          "Erro ao transcrever",
          "Não conseguimos converter seu áudio em texto. Tente novamente.",
        );
      } finally {
        setIsTranscribing(false);
      }
    },
    [cookies, sendMessage, stopSpeech],
  );

  const stopRecordingAndTranscribe = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        await transcribeAndSend(uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Erro ao gravar",
        "Não conseguimos finalizar a gravação. Tente novamente.",
      );
    } finally {
      recordingRef.current = null;
    }
  }, [transcribeAndSend]);

  const cancelRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
    } catch (error) {
      console.error(error);
    } finally {
      recordingRef.current = null;
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (status !== "ready" || isTranscribing) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Ative o microfone para enviar áudio.",
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Erro ao gravar",
        "Não conseguimos iniciar a gravação. Tente novamente.",
      );
      setIsRecording(false);
      recordingRef.current = null;
    }
  }, [isTranscribing, status]);

  const handleAudioToggle = useCallback(
    async (messageId: string, messageText: string) => {
      const textToRead = messageText.replace(/\s+/g, " ").trim();
      if (!textToRead) return;

      if (speakingMessageId === messageId) {
        await stopSpeech();
        return;
      }

      await stopSpeech();
      setSpeakingMessageId(messageId);
      setIsAudioPaused(false);

      Speech.speak(textToRead, {
        language: "pt-BR",
        pitch: 1.0,
        rate: 0.95,
        onDone: stopSpeech,
        onStopped: stopSpeech,
        onError: stopSpeech,
      });
    },
    [speakingMessageId, stopSpeech],
  );

  const handlePauseResumeAudio = useCallback(async () => {
    if (!speakingMessageId) return;

    if (isAudioPaused) {
      await Speech.resume();
      setIsAudioPaused(false);
    } else {
      await Speech.pause();
      setIsAudioPaused(true);
    }
  }, [isAudioPaused, speakingMessageId]);

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

  useEffect(() => {
    if (status === "submitted" || status === "streaming") {
      stopSpeech();
    }
  }, [status, stopSpeech]);

  useEffect(() => {
    return () => {
      stopSpeech();
      cancelRecording();
    };
  }, [stopSpeech, cancelRecording]);

  return (
    <Container
      className="flex-1 bg-white dark:bg-gray-950"
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View className="border-b border-gray-200 dark:border-gray-800 px-4 pt-3.5 pb-3">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={handleBack}
            className="rounded-full items-center justify-center"
          >
            <Icon
              icon={ArrowLeft}
              size={24}
              className="text-neutral-600 dark:text-gray-300"
            />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2.5">
            <Text className="text-4xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
              Tutor
            </Text>
            <Text className="text-4xl font-light text-gray-400 dark:text-gray-500 leading-tight">
              AI
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 h-auto"
        contentContainerStyle={messages.length === 0 ? { flex: 1 } : undefined}
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
              <View className="w-14 h-14 rounded-full bg-secondary dark:bg-primary/15 items-center justify-center">
                <Image
                  source={graduationHatIcon}
                  style={{ width: 40, height: 40, borderRadius: 8 }}
                  resizeMode="contain"
                />
              </View>

              <Text className="text-2xl font-medium text-gray-900 dark:text-gray-50 text-center leading-snug tracking-tight">
                Tutor Medwaster
              </Text>

              <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-tight px-4">
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
              const messageText = getMessageText(message);

              if (message.role === "user") {
                return (
                  <UserMessage
                    key={message.id}
                    message={messageText}
                  />
                );
              }

              const isAudioActive = speakingMessageId === message.id;

              return (
                <AiMessage
                  key={message.id}
                  message={messageText.trim() === "" ? null : messageText}
                  isStreaming={isCurrentlyStreaming}
                  isCancelled={isCancelled}
                  canPlayAudio={
                    !isCurrentlyStreaming && messageText.trim().length > 0
                  }
                  isAudioActive={isAudioActive}
                  isAudioPaused={isAudioPaused}
                  onAudioPress={
                    messageText
                      ? () => handleAudioToggle(message.id, messageText)
                      : undefined
                  }
                  onAudioPauseResume={
                    isAudioActive ? handlePauseResumeAudio : undefined
                  }
                />
              );
            })}

            {status === "submitted" && (
              <View className="px-4 py-3 gap-3">
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="rgb(21, 93, 252)" />
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Pensando...
                  </Text>
                </View>
              </View>
            )}
            {isTranscribing && (
              <View className="px-4 py-3 gap-3">
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="rgb(21, 93, 252)" />
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Transcrevendo áudio...
                  </Text>
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
            <View className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 px-4 py-2">
              {/* <TouchableOpacity className="w-8 h-8 rounded-full items-center justify-center mb-1"> */}
              {/*   <Paperclip size={18} className="text-gray-500" /> */}
              {/* </TouchableOpacity> */}

              <TextInput
                placeholder="Pergunte algo..."
                className="text-lg leading-tight text-neutral-900 dark:text-gray-50 px-2.5 py-2 placeholder:text-muted-foreground/80 dark:placeholder:text-muted-foreground/60"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                multiline
                maxLength={500}
                style={{ maxHeight: 120 }}
                textAlignVertical="top"
                editable={!isRecording && !isTranscribing}
              />
            </View>

            {status === "submitted" || status === "streaming" ? (
              <TouchableOpacity
                onPress={handleStop}
                disabled={!(status === "submitted" || status === "streaming")}
                className="mb-1"
              >
                <View className="size-14 rounded-full items-center justify-center bg-gray-700 dark:bg-gray-600">
                  <Icon
                    icon={Square}
                    size={14}
                    className="text-white fill-white"
                  />
                </View>
              </TouchableOpacity>
            ) : isRecording ? (
              <TouchableOpacity onPress={stopRecordingAndTranscribe} className="mb-1">
                <View className="size-14 rounded-full items-center justify-center bg-red-500">
                  <Icon icon={Square} size={14} className="text-white fill-white" />
                </View>
              </TouchableOpacity>
            ) : isTranscribing ? (
              <View className="mb-1">
                <View className="size-14 rounded-full items-center justify-center bg-gray-300 dark:bg-gray-700">
                  <ActivityIndicator color="#0F172A" />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={isInputEmpty ? handleStartRecording : handleSend}
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
