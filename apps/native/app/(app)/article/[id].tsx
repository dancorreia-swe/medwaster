import { Container } from "@/components/container";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  BookOpenCheck,
  ChevronLeft,
  Headphones,
  Heart,
  Pause,
  Play,
  Square,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMarkdown } from "react-native-marked";
import * as Speech from "expo-speech";
import { useArticleStore } from "@/lib/stores/article-store";
import {
  useStudentArticleDetail,
  useToggleFavorite,
} from "@/features/wiki/hooks";
import { markArticleAsRead } from "@/features/wiki/api";

const FALLBACK_CATEGORY_COLOR = "#155DFC";

export default function WikiArticle() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const articleId = Number(id);

  const isRead = useArticleStore((state) => state.isRead);
  const setRead = useArticleStore((state) => state.markAsRead);
  const unsetRead = useArticleStore((state) => state.markAsUnread);
  const isFavorite = useArticleStore((state) => state.isFavorite);
  const addFavorite = useArticleStore((state) => state.addFavorite);
  const removeFavorite = useArticleStore((state) => state.removeFavorite);

  const {
    data,
    isPending,
    isError,
    refetch: refetchArticle,
  } = useStudentArticleDetail(articleId);
  const toggleFavoriteMutation = useToggleFavorite();

  const article = data?.article;
  const articleProgress = data?.progress;
  const articleDifficulty = data?.difficulty;
  const favoriteFromServer = data?.isBookmarked ?? false;

  const articleIsRead =
    isRead(articleId) ||
    (articleProgress?.isRead ?? (articleProgress?.readPercentage ?? 0) >= 100);
  const articleIsFavorite =
    isFavorite(articleId) || favoriteFromServer || false;

  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [canScroll, setCanScroll] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const fabTranslateY = useRef(new Animated.Value(0)).current;
  const pauseButtonScale = useRef(new Animated.Value(0)).current;
  const pauseButtonTranslateY = useRef(new Animated.Value(100)).current;
  const isAnimating = useRef(false);
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);
  const autoMarkAsReadTriggered = useRef(false);

  useEffect(() => {
    if (!articleProgress) return;
    if (
      articleProgress.isRead ||
      (articleProgress.readPercentage ?? 0) >= 100
    ) {
      setRead(articleId);
    }
  }, [articleProgress, articleId, setRead]);

  // Reset auto-mark trigger when article changes
  useEffect(() => {
    autoMarkAsReadTriggered.current = false;
    setHasReachedEnd(false);
    setCanScroll(true);
    fabTranslateY.setValue(0);
  }, [articleId, fabTranslateY]);

  const contentText = useMemo(
    () => article?.contentText ?? "Conteúdo indisponível no momento.",
    [article?.contentText],
  );

  const handleMarkAsRead = useCallback(async () => {
    if (!article || !Number.isFinite(articleId)) return;
    try {
      await markArticleAsRead(articleId);
      setRead(articleId);
    } catch (error) {
      console.error("Erro ao marcar artigo como lido:", error);
      autoMarkAsReadTriggered.current = false;
    }
  }, [article, articleId, setRead]);

  // Auto-mark as read when user reaches the end or content is too short
  useEffect(() => {
    if (
      !articleIsRead &&
      hasReachedEnd &&
      !autoMarkAsReadTriggered.current &&
      article &&
      Number.isFinite(articleId)
    ) {
      autoMarkAsReadTriggered.current = true;
      // Use void to explicitly handle the promise
      void handleMarkAsRead().catch((err) => {
        console.error("Failed to auto-mark article as read:", err);
        autoMarkAsReadTriggered.current = false;
      });
    }
  }, [hasReachedEnd, articleIsRead, article, articleId, handleMarkAsRead]);

  const handleAudioReading = useCallback(async () => {
    if (!article) return;

    if (isReading) {
      await Speech.stop();
      setIsReading(false);
      setIsPaused(false);
    } else {
      const textToRead = contentText.replace(/\s+/g, " ").trim();
      if (textToRead.length === 0) return;

      setIsReading(true);
      setIsPaused(false);

      Speech.speak(`${article.title}. ${textToRead}`, {
        language: "pt-BR",
        pitch: 1.0,
        rate: 0.9,
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
  }, [article, contentText, isReading]);

  const handlePauseResume = useCallback(async () => {
    if (isPaused) {
      await Speech.resume();
      setIsPaused(false);
    } else {
      await Speech.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  useEffect(() => {
    if (isReading) {
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
  }, [isReading, pauseButtonScale, pauseButtonTranslateY]);

  const markdownElements = useMarkdown(contentText, {
    styles: {
      text: {
        color: "#111827",
        fontSize: 16,
        lineHeight: 26,
      },
      paragraph: {
        marginBottom: 16,
        fontSize: 16,
        lineHeight: 26,
        color: "#111827",
      },
      h1: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
        marginTop: 24,
        marginBottom: 16,
        lineHeight: 34,
      },
      h2: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginTop: 20,
        marginBottom: 12,
        lineHeight: 30,
      },
      h3: {
        fontSize: 20,
        fontWeight: "600",
        color: "#111827",
        marginTop: 16,
        marginBottom: 10,
        lineHeight: 26,
      },
      h4: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        marginTop: 14,
        marginBottom: 8,
        lineHeight: 24,
      },
      list: {
        marginBottom: 16,
        marginLeft: 8,
      },
      listItem: {
        marginBottom: 8,
        fontSize: 16,
        lineHeight: 26,
        color: "#111827",
      },
      bullet: {
        color: "#155DFC",
        fontSize: 20,
      },
      blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: "#155DFC",
        paddingLeft: 16,
        marginVertical: 16,
        backgroundColor: "#EFF6FF",
        paddingVertical: 12,
        paddingRight: 12,
        borderRadius: 8,
      },
      blockquoteText: {
        fontSize: 16,
        lineHeight: 26,
        color: "#1e40af",
        fontStyle: "italic",
      },
      code: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: "monospace",
        fontSize: 14,
        color: "#DC2626",
      },
      codeBlock: {
        backgroundColor: "#1F2937",
        padding: 16,
        borderRadius: 8,
        marginVertical: 16,
      },
      codeBlockText: {
        fontFamily: "monospace",
        fontSize: 14,
        lineHeight: 20,
        color: "#F9FAFB",
      },
      strong: {
        fontWeight: "700",
        color: "#111827",
      },
      em: {
        fontStyle: "italic",
      },
      link: {
        color: "#155DFC",
        textDecorationLine: "underline",
      },
      hr: {
        backgroundColor: "#E5E7EB",
        height: 1,
        marginVertical: 24,
      },
    },
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        const contentSize = event.nativeEvent.contentSize.height;
        const diff = currentScrollY - lastScrollY.current;

        // Check if user has scrolled to the bottom (within 50px threshold)
        const isAtBottom = layoutHeight + currentScrollY >= contentSize - 50;

        if (isAtBottom && !hasReachedEnd) {
          setHasReachedEnd(true);
        }

        // Only hide/show FAB if content is scrollable
        if (!canScroll || isAnimating.current) return;

        if (diff > 10 && currentScrollY > 100) {
          isAnimating.current = true;
          Animated.timing(fabTranslateY, {
            toValue: 150,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            isAnimating.current = false;
          });
        } else if (diff < -10) {
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

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      contentHeight.current = height;

      // If content is shorter than viewport, mark as reached end automatically
      if (scrollViewHeight.current > 0) {
        const isScrollable = height > scrollViewHeight.current;
        setCanScroll(isScrollable);

        if (!isScrollable) {
          setHasReachedEnd(true);
          // Ensure FAB is visible for non-scrollable content
          fabTranslateY.setValue(0);
        }
      }
    },
    [fabTranslateY],
  );

  const handleLayout = useCallback(
    (event: any) => {
      scrollViewHeight.current = event.nativeEvent.layout.height;

      // Check again if content is too short
      if (contentHeight.current > 0) {
        const isScrollable = contentHeight.current > scrollViewHeight.current;
        setCanScroll(isScrollable);

        if (!isScrollable) {
          setHasReachedEnd(true);
          // Ensure FAB is visible for non-scrollable content
          fabTranslateY.setValue(0);
        }
      }
    },
    [fabTranslateY],
  );

  const handleFavoriteToggle = useCallback(() => {
    if (!article) return;

    toggleFavoriteMutation.mutate(
      {
        articleId,
        isFavorite: articleIsFavorite,
      },
      {
        onSuccess: ({ isFavorite: nowFavorite }) => {
          if (nowFavorite) {
            addFavorite(articleId);
          } else {
            removeFavorite(articleId);
          }
        },
      },
    );
  }, [
    article,
    toggleFavoriteMutation,
    articleId,
    articleIsFavorite,
    addFavorite,
    removeFavorite,
  ]);

  const handleMarkAsUnread = useCallback(() => {
    unsetRead(articleId);
  }, [articleId, unsetRead]);

  const categoryName = article?.category?.name;
  const categoryColor = article?.category?.color ?? FALLBACK_CATEGORY_COLOR;
  const categoryInitial = categoryName
    ? categoryName.charAt(0).toUpperCase()
    : "W";
  const readingTimeMinutes = article?.readingTimeMinutes
    ? Math.max(1, Math.round(article.readingTimeMinutes))
    : null;

  if (!Number.isFinite(articleId)) {
    return (
      <Container className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600 text-base">
          Artigo inválido. Volte e selecione novamente.
        </Text>
      </Container>
    );
  }

  if (isPending) {
    return (
      <Container className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color={FALLBACK_CATEGORY_COLOR} />
      </Container>
    );
  }

  if (isError || !article) {
    return (
      <Container className="flex-1 bg-gray-50 items-center justify-center gap-4">
        <Text className="text-gray-600 text-base">
          Não foi possível carregar o artigo.
        </Text>
        <TouchableOpacity
          onPress={() => refetchArticle()}
          className="px-4 py-2 rounded-full bg-primary"
        >
          <Text className="text-white font-semibold">Tentar novamente</Text>
        </TouchableOpacity>
      </Container>
    );
  }

  return (
    <Container className="flex-1 bg-gray-50">
      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        <View className="px-6 pt-4 pb-6 bg-white border-b border-gray-100">
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
              onPress={handleFavoriteToggle}
              className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={
                articleIsFavorite
                  ? "Remover dos favoritos"
                  : "Adicionar aos favoritos"
              }
            >
              <Heart
                size={22}
                color={articleIsFavorite ? "#ef4444" : "#6B7280"}
                fill={articleIsFavorite ? "#ef4444" : "none"}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-4">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center border"
              style={{
                backgroundColor: "#F9FAFB",
                borderColor: categoryColor,
              }}
            >
              {article.icon ? (
                <Text className="text-3xl">{article.icon}</Text>
              ) : (
                <Text
                  className="text-2xl font-semibold"
                  style={{ color: categoryColor }}
                >
                  {categoryInitial}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 leading-tight">
                {article.title}
              </Text>
              <View className="flex-row flex-wrap gap-2 mt-3">
                {articleDifficulty ? (
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${articleDifficulty.color}20` }}
                  >
                    <Text
                      className="text-xs font-semibold text-gray-900 uppercase"
                      style={{ color: articleDifficulty.color }}
                    >
                      {articleDifficulty.label}
                    </Text>
                  </View>
                ) : null}
                {readingTimeMinutes ? (
                  <View className="px-3 py-1 rounded-full bg-gray-100">
                    <Text className="text-xs font-semibold text-gray-600 uppercase">
                      {readingTimeMinutes} min
                    </Text>
                  </View>
                ) : null}
                {categoryName ? (
                  <View className="px-3 py-1 rounded-full bg-blue-50">
                    <Text className="text-xs font-semibold text-blue-700 uppercase">
                      {categoryName}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 pt-6">
          {markdownElements}

          {hasReachedEnd && articleIsRead && (
            <View className="mt-8 mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <View className="flex-row items-center justify-center gap-2">
                <BookOpenCheck size={20} color="#16a34a" strokeWidth={2} />
                <Text className="text-green-700 font-semibold text-center">
                  Artigo concluído!
                </Text>
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      <Animated.View
        style={{
          transform: [{ translateY: fabTranslateY }],
          position: "absolute",
          bottom: 32,
          alignSelf: "center",
        }}
        className="bg-primary rounded-full shadow-2xl"
      >
        <View className="flex-row items-center px-3 py-2.5 gap-2">
          <TouchableOpacity
            onPress={handleAudioReading}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              isReading ? "bg-red-500" : ""
            }`}
            accessibilityRole="button"
            accessibilityLabel={
              isReading ? "Parar leitura em áudio" : "Iniciar leitura em áudio"
            }
          >
            {isReading ? (
              <Square
                size={18}
                color="#FFFFFF"
                strokeWidth={2}
                fill="#FFFFFF"
              />
            ) : (
              <Headphones size={20} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>

          <View className="w-[1px] h-8 bg-white/20" />

          <TouchableOpacity
            onPress={() =>
              articleIsRead ? handleMarkAsUnread() : handleMarkAsRead()
            }
            className={`w-11 h-11 rounded-full items-center justify-center ${
              articleIsRead ? "bg-green-500/70" : "bg-white/20"
            }`}
            accessibilityRole="button"
            accessibilityLabel={
              articleIsRead ? "Marcar como não lido" : "Marcar como lido"
            }
          >
            <BookOpenCheck size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View
        style={{
          transform: [
            { translateY: pauseButtonTranslateY },
            { scale: pauseButtonScale },
          ],
          opacity: pauseButtonScale,
          position: "absolute",
          bottom: 35,
          left: 24,
        }}
        className="bg-blue-600 rounded-full shadow-2xl"
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
