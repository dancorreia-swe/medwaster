import { Container } from "@/components/container";
import { Text, View, TouchableOpacity, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Heart, BookOpenCheck, Headphones } from "lucide-react-native";
import { useState, useRef } from "react";
import Markdown from "react-native-marked";

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

  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const fabTranslateY = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

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
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

        {/* Content */}
        <View className="px-6 pt-6 pb-8">
          <Markdown value={article.content} />
        </View>
      </Animated.ScrollView>

      {/* Floating Action Bar */}
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
          {/* Audio Reading Button */}
          <TouchableOpacity
            className="w-11 h-11 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Leitura em áudio"
          >
            <Headphones size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          {/* Divider */}
          <View className="w-[1px] h-8 bg-white/20 mx-2" />

          {/* Mark as Read Button */}
          <TouchableOpacity
            onPress={() => setIsRead(!isRead)}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              isRead ? "bg-green-500/70" : "bg-white/20"
            }`}
            accessibilityRole="button"
            accessibilityLabel={isRead ? "Marcar como não lido" : "Marcar como lido"}
          >
            <BookOpenCheck 
              size={20} 
              color="#FFFFFF" 
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Container>
  );
}
