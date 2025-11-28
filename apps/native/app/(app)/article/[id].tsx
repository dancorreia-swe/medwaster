import { Container } from "@/components/container";
import {
  ActivityIndicator,
  Animated,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMarkdown } from "react-native-marked";
import { WebView } from "react-native-webview";
import Pdf from "react-native-pdf";
import { ExternalLink } from "lucide-react-native";
import { useArticleStore } from "@/lib/stores/article-store";
import { useColorScheme } from "@/lib/use-color-scheme";
import {
  useStudentArticleDetail,
  useToggleFavorite,
} from "@/features/wiki/hooks";
import {
  markArticleAsRead,
  markArticleAsUnread,
  fetchPdfText,
} from "@/features/wiki/api";
import {
  useMarkTrailArticleRead,
  useTrail,
  trailKeys,
} from "@/features/trails/hooks";
import {
  ArticleHeader,
  ArticleTitleSection,
  CompletionBadge,
  AudioControlFab,
  PauseButton,
  useArticleAudio,
  useArticleScroll,
} from "@/features/wiki/components/article-detail";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { gamificationKeys } from "@/features/gamification/hooks";

const FALLBACK_CATEGORY_COLOR = "#155DFC";

export default function WikiArticle() {
  const { id, trailId, contentId } = useLocalSearchParams<{
    id?: string;
    trailId?: string;
    contentId?: string;
  }>();
  const { isDarkColorScheme } = useColorScheme();
  const articleId = Number(id);
  const trailIdNum = trailId ? Number(trailId) : null;
  const contentIdNum = contentId ? Number(contentId) : null;

  const router = useRouter();
  const queryClient = useQueryClient();

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

  const { data: trail } = useTrail(trailIdNum || 0);

  const article = data?.article;
  const articleProgress = data?.progress;
  const articleDifficulty = data?.difficulty;
  const articleIsRead = useMemo(() => {
    if (unreadArticles.has(articleId)) {
      return false;
    }

    const inStore = readArticles.has(articleId);
    const fromServer =
      articleProgress?.isRead ?? (articleProgress?.readPercentage ?? 0) >= 100;

    return inStore || fromServer;
  }, [unreadArticles, readArticles, articleId, articleProgress]);
  const articleIsFavorite = favoriteArticles.has(articleId);

  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [canScroll, setCanScroll] = useState(true);
  const autoMarkAsReadTriggered = useRef(false);
  const [webViewHasError, setWebViewHasError] = useState(false);
  const [pdfLoadingProgress, setPdfLoadingProgress] = useState(0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfTextLoading, setPdfTextLoading] = useState(false);
  const metadataSheetRef = useRef<BottomSheet>(null);

  const { isReading, isPaused, handleAudioReading, handlePauseResume } =
    useArticleAudio();

  const handleMarkAsReadCallback = useCallback(async () => {
    if (!article || !Number.isFinite(articleId)) return;
    console.log('[Article] Marking article as read:', {
      articleId,
      title: article.title,
      trailId: trailIdNum,
      contentId: contentIdNum,
    });
    try {
      setRead(articleId);
      await markArticleAsRead(articleId);
      console.log('[Article] Article marked as read successfully');

      queryClient.invalidateQueries({
        queryKey: gamificationKeys.todayActivity(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.weeklyStats(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.activityHistory(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.missions(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.streak(),
      });

      // Ensure trail data reflects the newly read article (even when coming from wiki)
      console.log('[Article] Clearing trail cache...');
      // Use removeQueries to completely clear cache, forcing fresh fetch on next access
      queryClient.removeQueries({ queryKey: trailKeys.all });
      // Also invalidate to trigger refetch for any active queries
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
      console.log('[Article] Trail cache cleared');

      if (trailIdNum && contentIdNum) {
        const result = await markTrailArticleReadMutation.mutateAsync({
          trailId: trailIdNum,
          contentId: contentIdNum,
        });

        if (result?.trailJustCompleted && result?.progress && trail) {
          setTimeout(() => {
            const completedIds =
              typeof result.progress.completedContentIds === "string"
                ? JSON.parse(result.progress.completedContentIds || "[]")
                : result.progress.completedContentIds || [];

            router.push({
              pathname: "/(app)/trails/celebration",
              params: {
                trailName: trail.name,
                difficulty: trail.difficulty,
                score: String(result.progress.currentScore || 0),
                isPassed: String(result.progress.isPassed || false),
                timeSpentMinutes: String(result.progress.timeSpentMinutes || 0),
                completedContent: String(completedIds.length),
                totalContent: String(trail.content?.length || 0),
              },
            } as any);
          }, 500);
        }
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
    router,
    trail,
    queryClient,
  ]);

  const {
    scrollY,
    fabTranslateY,
    pauseButtonScale,
    pauseButtonTranslateY,
    contentHeight,
    scrollViewHeight,
    handleScroll,
  } = useArticleScroll(
    // Disable auto-read for external articles
    isExternalArticle ? undefined : handleMarkAsReadCallback,
    canScroll,
    setHasReachedEnd,
    isReading,
  );

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
  }, [
    hasReachedEnd,
    articleIsRead,
    article,
    articleId,
    handleMarkAsReadCallback,
  ]);

  const contentText = useMemo(
    () => article?.contentText ?? "Conteúdo indisponível no momento.",
    [article?.contentText],
  );

  const handleAudioPress = useCallback(async () => {
    if (!article) return;
    if (isExternalArticle && isPdfExternal && externalUrl) {
      try {
        let text = pdfText;
        if (!text) {
          setPdfTextLoading(true);
          const res = await fetchPdfText(externalUrl);
          text = res.content;
          setPdfText(res.content);
        }
        const textToRead = `${article.title}. ${text ?? ""}`;
        await handleAudioReading(textToRead);
      } catch (error) {
        console.error("Erro ao ler PDF em voz alta:", error);
        Alert.alert("Erro", "Não foi possível ler o PDF em voz alta.");
      } finally {
        setPdfTextLoading(false);
      }
      return;
    }

    const textToRead = `${article.title}. ${contentText}`;
    await handleAudioReading(textToRead, () => {
      void handleMarkAsReadCallback().catch(console.error);
    });
  }, [
    article,
    contentText,
    handleAudioReading,
    handleMarkAsReadCallback,
    isExternalArticle,
    isPdfExternal,
    externalUrl,
    pdfText,
  ]);

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
        color: isDarkColorScheme ? "#E5E7EB" : "#111827",
        fontSize: 16,
        lineHeight: 26,
      },
      paragraph: {
        marginBottom: 16,
        fontSize: 16,
        lineHeight: 26,
        color: isDarkColorScheme ? "#E5E7EB" : "#111827",
      },
      h1: {
        fontSize: 28,
        fontWeight: "700",
        color: isDarkColorScheme ? "#F3F4F6" : "#111827",
        marginTop: 24,
        marginBottom: 16,
        lineHeight: 34,
      },
      h2: {
        fontSize: 24,
        fontWeight: "700",
        color: isDarkColorScheme ? "#F3F4F6" : "#111827",
        marginTop: 20,
        marginBottom: 12,
        lineHeight: 30,
      },
      h3: {
        fontSize: 20,
        fontWeight: "600",
        color: isDarkColorScheme ? "#E5E7EB" : "#111827",
        marginTop: 16,
        marginBottom: 10,
        lineHeight: 26,
      },
      h4: {
        fontSize: 18,
        fontWeight: "600",
        color: isDarkColorScheme ? "#E5E7EB" : "#111827",
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
        color: isDarkColorScheme ? "#D1D5DB" : "#111827",
      },
      bullet: {
        color: isDarkColorScheme ? "#93C5FD" : "#155DFC",
        fontSize: 20,
      },
      blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: isDarkColorScheme ? "#1d4ed8" : "#155DFC",
        paddingLeft: 16,
        marginVertical: 16,
        backgroundColor: isDarkColorScheme ? "#0f172a" : "#EFF6FF",
        paddingVertical: 12,
        paddingRight: 12,
        borderRadius: 8,
      },
      blockquoteText: {
        fontSize: 16,
        lineHeight: 26,
        color: isDarkColorScheme ? "#BFDBFE" : "#1e40af",
        fontStyle: "italic",
      },
      code: {
        backgroundColor: isDarkColorScheme ? "#111827" : "#F3F4F6",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: "monospace",
        fontSize: 14,
        color: isDarkColorScheme ? "#F59E0B" : "#DC2626",
      },
      codeBlock: {
        backgroundColor: isDarkColorScheme ? "#0b1220" : "#1F2937",
        padding: 16,
        borderRadius: 8,
        marginVertical: 16,
      },
      codeBlockText: {
        fontFamily: "monospace",
        fontSize: 14,
        lineHeight: 20,
        color: isDarkColorScheme ? "#E5E7EB" : "#F9FAFB",
      },
      strong: {
        fontWeight: "700",
        color: isDarkColorScheme ? "#F3F4F6" : "#111827",
      },
      em: {
        fontStyle: "italic",
      },
      link: {
        color: isDarkColorScheme ? "#93C5FD" : "#155DFC",
        textDecorationLine: "underline",
      },
      hr: {
        backgroundColor: isDarkColorScheme ? "#1F2937" : "#E5E7EB",
        height: 1,
        marginVertical: 24,
      },
    },
  });

  const handleFavoriteToggle = useCallback(() => {
    if (!article) return;

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

  const isExternalArticle =
    article?.sourceType === "external" ||
    (!!article?.externalUrl && !article?.content);
  const externalUrl = article?.externalUrl;
  const isPdfExternal = useMemo(() => {
    if (!externalUrl) return false;
    const urlLower = externalUrl.toLowerCase();
    return (
      urlLower.endsWith(".pdf") ||
      urlLower.includes(".pdf?") ||
      urlLower.includes("/pdf")
    );
  }, [externalUrl]);

  const webViewUrl = useMemo(() => {
    if (!externalUrl || isPdfExternal) return null;
    return externalUrl;
  }, [externalUrl, isPdfExternal]);

  const pdfSource = useMemo(() => {
    if (!externalUrl || !isPdfExternal) return null;
    return {
      uri: externalUrl,
      cache: true,
    } as const;
  }, [externalUrl, isPdfExternal]);

  const hasMetadata = useMemo(() => {
    const hasAuthors =
      Array.isArray(article?.externalAuthors) &&
      article.externalAuthors.length > 0;
    return (
      hasAuthors ||
      !!article?.publicationSource ||
      !!article?.publicationDate ||
      !!article?.externalUrl
    );
  }, [article]);

  const formatPublishedDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const publishedDate = formatPublishedDate(article?.publicationDate);

  const snapPoints = useMemo(() => ["35%", "50%"], []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  useEffect(() => {
    setWebViewHasError(false);
    setPdfError(null);
    setPdfLoadingProgress(0);
  }, [webViewUrl, pdfSource]);

  useEffect(() => {
    if (article) {
      console.log("[ArticleDetail] data", {
        id: article.id,
        sourceType: article.sourceType,
        hasContent: !!article.content,
        externalUrl,
        isExternalArticle,
        isPdfExternal,
        webViewUrl,
      });
    }
  }, [article, externalUrl, isExternalArticle, isPdfExternal, webViewUrl]);

  const logWebView = (label: string, payload?: any) => {
    try {
      // Keep logs concise to avoid flooding console
      console.log("[ExternalWebView]", label, {
        uri: payload?.url || payload?.uri || webViewUrl || externalUrl,
        isPdfExternal,
        error: payload?.description || payload?.title || undefined,
        statusCode: payload?.statusCode,
        loading: payload?.loading,
        canGoBack: payload?.canGoBack,
        canGoForward: payload?.canGoForward,
      });
    } catch {}
  };

  const handleOpenExternalUrl = useCallback(async () => {
    if (!externalUrl) return;
    try {
      await Linking.openURL(externalUrl);
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  }, [externalUrl]);

  const handleOpenInBrowser = useCallback(async () => {
    await handleOpenExternalUrl();
  }, [handleOpenExternalUrl]);

  if (!Number.isFinite(articleId)) {
    return (
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <Text className="text-gray-600 dark:text-gray-300 text-base">
          Artigo inválido. Volte e selecione novamente.
        </Text>
      </Container>
    );
  }

  if (isPending) {
    return (
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color={FALLBACK_CATEGORY_COLOR} />
      </Container>
    );
  }

  if (isError || !article) {
    return (
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center gap-4">
        <Text className="text-gray-600 dark:text-gray-300 text-base">
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
    <Container className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ArticleHeader
        articleIsFavorite={articleIsFavorite}
        onToggleFavorite={handleFavoriteToggle}
        showMetadataButton={isExternalArticle && hasMetadata}
        onOpenMetadata={() => metadataSheetRef.current?.expand()}
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
          readingTimeMinutes={readingTimeMinutes ?? undefined}
          isRead={articleIsRead}
        />

        {isExternalArticle && externalUrl ? (
          <View className="px-0 pt-0 flex-1">
            {/* Viewer */}
            {isPdfExternal && pdfSource ? (
              <View
                className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm"
                style={{ height: 720 }}
              >
                <Pdf
                  trustAllCerts
                  source={pdfSource}
                  style={{ flex: 1, width: "100%" }}
                  renderActivityIndicator={() => (
                    <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
                      <ActivityIndicator size="large" color={categoryColor} />
                    </View>
                  )}
                  onLoadProgress={(percent) => {
                    setPdfLoadingProgress(percent ?? 0);
                    setPdfError(null);
                  }}
                  onLoadComplete={() => {
                    setPdfError(null);
                  }}
                  onError={(error) => {
                    console.error("PDF error:", error);
                    setPdfError(error?.message || "Erro ao carregar o PDF");
                  }}
                />

                {pdfError ? (
                  <View className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <Text className="text-sm text-center text-red-600 dark:text-red-300">
                      {pdfError}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View
                className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm"
                style={{ height: 720 }}
              >
                <WebView
                  key={webViewUrl || externalUrl}
                  source={{ uri: webViewUrl || externalUrl }}
                  startInLoadingState
                  renderLoading={() => (
                    <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
                      <ActivityIndicator size="large" color={categoryColor} />
                    </View>
                  )}
                  originWhitelist={["*"]}
                  onLoadStart={(event) => {
                    setWebViewHasError(false);
                    logWebView("load-start", event.nativeEvent);
                  }}
                  onLoad={(event) => {
                    logWebView("load", event.nativeEvent);
                  }}
                  onLoadEnd={(event) => {
                    logWebView("load-end", event.nativeEvent);
                  }}
                  onNavigationStateChange={(navState) => {
                    logWebView("nav", navState);
                  }}
                  onHttpError={(event) => {
                    logWebView("http-error", event.nativeEvent);
                  }}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error("WebView error:", nativeEvent);
                    logWebView("error", nativeEvent);
                    setWebViewHasError(true);
                  }}
                  renderError={() => (
                    <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                      <Text className="text-center text-gray-700 dark:text-gray-200 font-semibold mb-2">
                        Não foi possível carregar o conteúdo.
                      </Text>
                      <Text className="text-center text-gray-600 dark:text-gray-400 text-sm">
                        Verifique sua conexão e tente novamente.
                      </Text>
                    </View>
                  )}
                />

                {webViewHasError && (
                  <View className="p-4 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                    <Text className="text-sm text-gray-700 dark:text-gray-200 text-center">
                      Problema ao carregar. Abra pelo menu de detalhes.
                    </Text>
                  </View>
                )}
              </View>
            )}

            <CompletionBadge
              isRead={articleIsRead}
              hasReachedEnd={hasReachedEnd}
            />
          </View>
        ) : (
          <View className="px-6 pt-6">
            {markdownElements?.map((element, index) => (
              <View key={`markdown-${index}`}>{element}</View>
            ))}
            <CompletionBadge
              isRead={articleIsRead}
              hasReachedEnd={hasReachedEnd}
            />
          </View>
        )}
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

      <BottomSheet
        ref={metadataSheetRef}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetView className="px-6 py-4 bg-white dark:bg-gray-900">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Detalhes do artigo
            </Text>
            <TouchableOpacity
              onPress={() => metadataSheetRef.current?.close()}
              className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800"
            >
              <Text className="text-sm text-gray-700 dark:text-gray-200">
                Fechar
              </Text>
            </TouchableOpacity>
          </View>

          {article?.externalAuthors && article.externalAuthors.length > 0 && (
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Autores
              </Text>
              <Text className="text-base text-gray-800 dark:text-gray-100 leading-6">
                {article.externalAuthors.join(", ")}
              </Text>
            </View>
          )}

          {article?.publicationSource && (
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Fonte
              </Text>
              <Text className="text-base text-gray-800 dark:text-gray-100 leading-6">
                {article.publicationSource}
              </Text>
            </View>
          )}

          {publishedDate && (
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Publicado em
              </Text>
              <Text className="text-base text-gray-800 dark:text-gray-100 leading-6">
                {publishedDate}
              </Text>
            </View>
          )}

          {externalUrl && (
            <TouchableOpacity
              onPress={handleOpenExternalUrl}
              className="flex-row items-center gap-2 px-4 py-3 bg-primary rounded-xl mt-2"
              activeOpacity={0.85}
            >
              <ExternalLink size={18} color="white" />
              <Text className="text-white font-semibold">Abrir no navegador</Text>
            </TouchableOpacity>
          )}
        </BottomSheetView>
      </BottomSheet>
    </Container>
  );
}
