import { Container } from "@/components/container";
import { ActivityIndicator, Animated, View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMarkdown } from "react-native-marked";
import { useArticleStore } from "@/lib/stores/article-store";
import {
  useStudentArticleDetail,
  useToggleFavorite,
} from "@/features/wiki/hooks";
import { markArticleAsRead, markArticleAsUnread } from "@/features/wiki/api";
import { useMarkTrailArticleRead } from "@/features/trails/hooks";
import {
  ArticleHeader,
  ArticleTitleSection,
  CompletionBadge,
  AudioControlFab,
  PauseButton,
  useArticleAudio,
  useArticleScroll,
} from "@/features/wiki/components/article-detail";

const FALLBACK_CATEGORY_COLOR = "#155DFC";

export default function WikiArticle() {
  const { id, trailId, contentId } = useLocalSearchParams<{
    id?: string;
    trailId?: string;
    contentId?: string;
  }>();
  const articleId = Number(id);
  const trailIdNum = trailId ? Number(trailId) : null;
  const contentIdNum = contentId ? Number(contentId) : null;

  const readArticles = useArticleStore((state) => state.readArticles);
  const unreadArticles = useArticleStore((state) => state.unreadArticles);
  const setRead = useArticleStore((state) => state.markAsRead);
  const unsetRead = useArticleStore((state) => state.markAsUnread);
  const favoriteArticles = useArticleStore((state) => state.favoriteArticles);
  const addFavorite = useArticleStore((state) => state.addFavorite);
  const removeFavorite = useArticleStore((state) => state.removeFavorite);

  const {
    data,
    isPending,
    isError,
    refetch: refetchArticle,
  } = useStudentArticleDetail(articleId);
  const toggleFavoriteMutation = useToggleFavorite();
  const markTrailArticleReadMutation = useMarkTrailArticleRead();

  const article = data?.article;
  const articleProgress = data?.progress;
  const articleDifficulty = data?.difficulty;
  const articleIsRead = useMemo(() => {
    // If explicitly marked as unread by user, respect that
    if (unreadArticles.has(articleId)) {
      return false;
    }
    
    // Otherwise check Zustand or server data
    const inStore = readArticles.has(articleId);
    const fromServer = articleProgress?.isRead ?? (articleProgress?.readPercentage ?? 0) >= 100;
    
    return inStore || fromServer;
  }, [unreadArticles, readArticles, articleId, articleProgress]);
  const articleIsFavorite = favoriteArticles.has(articleId);

  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [canScroll, setCanScroll] = useState(true);
  const autoMarkAsReadTriggered = useRef(false);

  const { isReading, isPaused, handleAudioReading, handlePauseResume } =
    useArticleAudio();

  const handleMarkAsReadCallback = useCallback(async () => {
    if (!article || !Number.isFinite(articleId)) return;
    try {
      setRead(articleId);
      await markArticleAsRead(articleId);

      // If viewing from trail context, also mark trail content as complete
      if (trailIdNum && contentIdNum) {
        await markTrailArticleReadMutation.mutateAsync({
          trailId: trailIdNum,
          contentId: contentIdNum,
        });
      }
    } catch (error) {
      console.error("Erro ao marcar artigo como lido:", error);
      unsetRead(articleId);
      autoMarkAsReadTriggered.current = false;
    }
  }, [
    article,
    articleId,
    setRead,
    unsetRead,
    trailIdNum,
    contentIdNum,
    markTrailArticleReadMutation,
  ]);

  const {
    scrollY,
    fabTranslateY,
    pauseButtonScale,
    pauseButtonTranslateY,
    contentHeight,
    scrollViewHeight,
    handleScroll,
  } = useArticleScroll(handleMarkAsReadCallback, canScroll, setHasReachedEnd);

  useEffect(() => {
    if (!articleProgress) return;
    if (
      articleProgress.isRead ||
      (articleProgress.readPercentage ?? 0) >= 100
    ) {
      setRead(articleId);
    }
  }, [articleProgress, articleId, setRead]);

  useEffect(() => {
    autoMarkAsReadTriggered.current = false;
    setHasReachedEnd(false);
    setCanScroll(true);
    fabTranslateY.setValue(0);
  }, [articleId, fabTranslateY]);

  useEffect(() => {
    if (
      !articleIsRead &&
      hasReachedEnd &&
      !autoMarkAsReadTriggered.current &&
      article &&
      Number.isFinite(articleId)
    ) {
      autoMarkAsReadTriggered.current = true;
      void handleMarkAsReadCallback().catch((err) => {
        console.error("Failed to auto-mark article as read:", err);
        autoMarkAsReadTriggered.current = false;
      });
    }
  }, [hasReachedEnd, articleIsRead, article, articleId, handleMarkAsReadCallback]);

  const contentText = useMemo(
    () => article?.contentText ?? "Conteúdo indisponível no momento.",
    [article?.contentText],
  );

  const handleAudioPress = useCallback(async () => {
    if (!article) return;
    const textToRead = `${article.title}. ${contentText}`;
    await handleAudioReading(textToRead, () => {
      void handleMarkAsReadCallback().catch(console.error);
    });
  }, [article, contentText, handleAudioReading, handleMarkAsReadCallback]);

  const handleMarkAsRead = useCallback(async () => {
    await handleMarkAsReadCallback();
  }, [handleMarkAsReadCallback]);

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

  const handleFavoriteToggle = useCallback(() => {
    if (!article) return;

    // Optimistic update
    if (articleIsFavorite) {
      removeFavorite(articleId);
    } else {
      addFavorite(articleId);
    }

    toggleFavoriteMutation.mutate(
      {
        articleId,
        isFavorite: articleIsFavorite,
      },
      {
        onError: () => {
          // Revert on error
          if (articleIsFavorite) {
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

  const handleMarkAsUnread = useCallback(async () => {
    if (!article || !Number.isFinite(articleId)) return;
    try {
      unsetRead(articleId);
      await markArticleAsUnread(articleId);
    } catch (error) {
      console.error("Erro ao marcar artigo como não lido:", error);
      setRead(articleId);
    }
  }, [article, articleId, unsetRead, setRead]);

  const handleReadToggle = useCallback(async () => {
    if (articleIsRead) {
      await handleMarkAsUnread();
    } else {
      await handleMarkAsRead();
    }
  }, [articleIsRead, handleMarkAsUnread, handleMarkAsRead]);

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
      <ArticleHeader
        articleIsFavorite={articleIsFavorite}
        onToggleFavorite={handleFavoriteToggle}
      />

      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        <ArticleTitleSection
          title={article.title}
          icon={article.icon ?? undefined}
          categoryName={categoryName}
          categoryColor={categoryColor}
          categoryInitial={categoryInitial}
          difficulty={articleDifficulty}
          readingTimeMinutes={readingTimeMinutes ?? undefined}
          isRead={articleIsRead}
        />

        <View className="px-6 pt-6">
          {markdownElements}
          <CompletionBadge isRead={articleIsRead} hasReachedEnd={hasReachedEnd} />
        </View>
      </Animated.ScrollView>

      <AudioControlFab
        isReading={isReading}
        articleIsRead={articleIsRead}
        fabTranslateY={fabTranslateY}
        onAudioPress={handleAudioPress}
        onReadToggle={handleReadToggle}
      />

      <PauseButton
        isReading={isReading}
        isPaused={isPaused}
        pauseButtonTranslateY={pauseButtonTranslateY}
        pauseButtonScale={pauseButtonScale}
        onPress={handlePauseResume}
      />
    </Container>
  );
}
