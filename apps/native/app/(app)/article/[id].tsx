import { Container } from "@/components/container";
import { Text, View, TouchableOpacity, Animated, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Heart,
  BookOpenCheck,
  Headphones,
  Pause,
  Square,
  Play,
} from "lucide-react-native";
import { useState, useRef, useEffect } from "react";
import { useMarkdown } from "react-native-marked";
import * as Speech from "expo-speech";

const articlesData = {
  "1": {
    title: "Descarte de Perfurocortantes",
    emoji: "💉",
    content: `# Descarte de Resíduos Perfurocortantes

Os resíduos perfurocortantes são materiais que podem causar cortes ou perfurações e representam um risco significativo de transmissão de doenças infecciosas.

## Classificação

Os materiais perfurocortantes incluem:

- Agulhas hipodérmicas
- Lâminas de bisturi
- Lancetas
- Pipetas de vidro
- Lâminas e lamínulas de microscopia
- Ampolas de vidro

## Procedimento de Descarte

### 1. Coletores Apropriados

> **Importante:** Utilize sempre coletores rígidos, impermeáveis e resistentes a perfurações, devidamente identificados com o símbolo de risco biológico.

Os coletores devem atender aos seguintes critérios:

1. **Material:** Plástico rígido resistente ou papelão especial
2. **Capacidade:** Nunca ultrapassar 2/3 da capacidade total
3. **Identificação:** Símbolo de risco biológico visível
4. **Cor:** Amarelo ou branco leitoso conforme norma

### 2. Técnica de Descarte

**NUNCA** reencape agulhas! O descarte deve ser feito da seguinte forma:

- Descarte imediatamente após o uso
- Introduza a agulha diretamente no coletor
- Não force o material para dentro do recipiente
- Mantenha o coletor próximo ao local de uso

### 3. Procedimento em Caso de Acidentes

Se ocorrer perfuração acidental:

1. Lave imediatamente a área com água e sabão
2. Notifique seu supervisor imediatamente
3. Procure atendimento médico
4. Preencha o relatório de acidente de trabalho

## Legislação

A RDC nº 222/2018 da ANVISA estabelece as diretrizes para o gerenciamento de resíduos de serviços de saúde.

## Responsabilidades

Todo profissional de saúde deve:

- Conhecer os protocolos de descarte
- Utilizar EPIs adequados
- Relatar não conformidades
- Participar de treinamentos regulares`,
  },
};

export default function WikiArticle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const article = articlesData[id as keyof typeof articlesData];
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const fabTranslateY = useRef(new Animated.Value(0)).current;
  const pauseButtonScale = useRef(new Animated.Value(0)).current;
  const pauseButtonTranslateY = useRef(new Animated.Value(100)).current;
  const isAnimating = useRef(false);

  const handleAudioReading = async () => {
    if (isReading) {
      // Stop reading completely
      await Speech.stop();
      setIsReading(false);
      setIsPaused(false);
    } else {
      // Start reading - clean markdown and read article
      const textToRead = article.content
        .replace(/[#*>`_\-\[\]()]/g, "") // Remove markdown syntax
        .replace(/\n\n+/g, ". ") // Replace multiple newlines with period
        .replace(/\n/g, " "); // Replace single newlines with space
      
      setIsReading(true);
      setIsPaused(false);
      
      Speech.speak(`${article.title}. ${textToRead}`, {
        language: "pt-BR", // Brazilian Portuguese
        pitch: 1.0,
        rate: 0.9, // Slightly slower for better comprehension
        onDone: () => {
          setIsReading(false);
          setIsPaused(false);
        },
        onStopped: () => {
          setIsReading(false);
          setIsPaused(false);
        },
        onError: () => {
          setIsReading(false);
          setIsPaused(false);
        },
      });
    }
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      await Speech.resume();
      setIsPaused(false);
    } else {
      await Speech.pause();
      setIsPaused(true);
    }
  };

  useEffect(() => {
    if (isReading) {
      // Animate pause button in
      Animated.parallel([
        Animated.spring(pauseButtonScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
        Animated.spring(pauseButtonTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
      ]).start();
    } else {
      // Animate pause button out
      Animated.parallel([
        Animated.spring(pauseButtonScale, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
        Animated.spring(pauseButtonTranslateY, {
          toValue: 100,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
      ]).start();
    }
  }, [isReading]);

  const markdownElements = useMarkdown(article?.content || "", {
    styles: {
      text: {
        color: "#111827",
        lineHeight: 24,
      },
      paragraph: {
        marginBottom: 4,
      },
      h1: {
        fontWeight: "bold",
        marginTop: 8,
        marginBottom: 12,
      },
      h2: {
        fontWeight: "bold",
        marginTop: 8,
        marginBottom: 10,
      },
      h3: {
        fontWeight: "600",
        marginTop: 8,
        marginBottom: 8,
      },
      list: {
        marginBottom: 8,
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: "#3B82F6",
        paddingLeft: 16,
        marginVertical: 12,
        backgroundColor: "#F0F7FF",
        paddingVertical: 12,
        borderRadius: 8,
      },
      strong: {
        fontWeight: "bold",
      },
    },
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        if (isAnimating.current) return;

        if (diff > 10 && currentScrollY > 100) {
          // Scrolling down - hide FAB
          isAnimating.current = true;
          Animated.timing(fabTranslateY, {
            toValue: 150,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false;
          });
        } else if (diff < -10) {
          // Scrolling up - show FAB
          isAnimating.current = true;
          Animated.timing(fabTranslateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false;
          });
        }

        lastScrollY.current = currentScrollY;
      },
    },
  );

  const headerComponent = () => (
    <View>
      <View className="px-6 pt-4 pb-6 bg-white border-b border-gray-100">
        {/* Navigation Row */}
        <View className="flex-row items-center justify-between mb-6 mt-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <ChevronLeft size={24} color="#364153" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsFavorite(!isFavorite)}
            className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
            }
          >
            <Heart
              size={22}
              color={isFavorite ? "#ef4444" : "#6B7280"}
              fill={isFavorite ? "#ef4444" : "none"}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 bg-blue-50 rounded-2xl items-center justify-center">
            <Text className="text-[32px]">{article.emoji}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 leading-tight">
              {article.title}
            </Text>
          </View>
        </View>
      </View>
      {/* Content wrapper with padding */}
      <View style={{ paddingHorizontal: 24, paddingTop: 24 }} />
    </View>
  );

  if (!article) {
    return (
      <Container className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600 text-base">Artigo não encontrado</Text>
      </Container>
    );
  }

  return (
    <Container className="flex-1 bg-gray-50">
      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6 bg-white border-b border-gray-100">
          {/* Navigation Row */}
          <View className="flex-row items-center justify-between mb-6 mt-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <ChevronLeft size={24} color="#364153" strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsFavorite(!isFavorite)}
              className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={
                isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
              }
            >
              <Heart
                size={22}
                color={isFavorite ? "#ef4444" : "#6B7280"}
                fill={isFavorite ? "#ef4444" : "none"}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 bg-blue-50 rounded-2xl items-center justify-center">
              <Text className="text-[32px]">{article.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 leading-tight">
                {article.title}
              </Text>
            </View>
          </View>
        </View>

        {/* Markdown Content */}
        <View className="px-6 pt-6">
          {markdownElements}
        </View>
      </Animated.ScrollView>

      <Animated.View
        style={{
          transform: [{ translateY: fabTranslateY }],
          position: "absolute",
          bottom: 32,
          left: "50%",
          marginLeft: -68,
        }}
        className="bg-primary rounded-full shadow-2xl"
      >
        <View className="flex-row items-center px-2 py-2.5">
          {/* Stop Button */}
          <TouchableOpacity
            onPress={handleAudioReading}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              isReading ? "bg-red-500" : ""
            }`}
            accessibilityRole="button"
            accessibilityLabel={isReading ? "Parar leitura em áudio" : "Iniciar leitura em áudio"}
          >
            {isReading ? (
              <Square size={18} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
            ) : (
              <Headphones size={20} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>

          <View className="w-[1px] h-8 bg-white/20 mx-2" />

          <TouchableOpacity
            onPress={() => setIsRead(!isRead)}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              isRead ? "bg-green-500/70" : "bg-white/20"
            }`}
            accessibilityRole="button"
            accessibilityLabel={
              isRead ? "Marcar como não lido" : "Marcar como lido"
            }
          >
            <BookOpenCheck size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Pause/Play Button - Separate Floating Button */}
      <Animated.View
        style={{
          transform: [
            { translateY: pauseButtonTranslateY },
            { scale: pauseButtonScale },
          ],
          opacity: pauseButtonScale,
          position: "absolute",
          bottom: 35,
          left: "50%",
          marginLeft: -148,
        }}
        className="bg-primary rounded-full shadow-2xl"
        pointerEvents={isReading ? "auto" : "none"}
      >
        <TouchableOpacity
          onPress={handlePauseResume}
          className="w-14 h-14 rounded-full items-center justify-center bg-primary"
          accessibilityRole="button"
          accessibilityLabel={isPaused ? "Retomar leitura" : "Pausar leitura"}
        >
          {isPaused ? (
            <Play size={24} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
          ) : (
            <Pause size={24} color="#FFFFFF" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </Container>
  );
}
