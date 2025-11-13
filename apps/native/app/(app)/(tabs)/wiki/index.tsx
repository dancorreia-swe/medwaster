import {
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Text,
} from "react-native";
import { Container } from "@/components/container";
import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import {
  WikiHeader,
  WikiFilterTabs,
  WikiSearchBar,
  WikiArticlesList,
  CategoryFilterBottomSheet,
} from "@/features/wiki/components";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet from "@gorhom/bottom-sheet";
import { useArticleStore } from "@/lib/stores/article-store";
import {
  useStudentArticles,
  useStudentCategories,
  useToggleFavorite,
} from "@/features/wiki/hooks";
import type { StudentArticleListItem } from "@server/modules/wiki/types/article";

type TabType = "todos" | "favoritos" | "lidos" | "categorias";

const ARTICLES_QUERY = {
  limit: 50,
} as const;

export default function WikiScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [hasInitializedFavorites, setHasInitializedFavorites] = useState(false);

  const isRead = useArticleStore((state) => state.isRead);
  const isFavorite = useArticleStore((state) => state.isFavorite);
  const addFavorite = useArticleStore((state) => state.addFavorite);
  const removeFavorite = useArticleStore((state) => state.removeFavorite);
  const setFavoriteArticles = useArticleStore(
    (state) => state.setFavoriteArticles,
  );
  const setReadArticles = useArticleStore((state) => state.setReadArticles);

  const {
    data: articlesResponse,
    isPending,
    isRefetching,
    isError,
    refetch,
  } = useStudentArticles(ARTICLES_QUERY);

  const { data: categoriesResponse } = useStudentCategories();
  const toggleFavoriteMutation = useToggleFavorite();

  // Initialize favorites and read state only once from server
  useEffect(() => {
    if (!articlesResponse || hasInitializedFavorites) return;

    setFavoriteArticles(
      articlesResponse.articles
        .filter((article) => article.isBookmarked)
        .map((article) => article.id),
    );

    setReadArticles(
      articlesResponse.articles
        .filter(
          (article) =>
            article.progress.isRead ||
            article.progress.readPercentage >= 100,
        )
        .map((article) => article.id),
    );
    
    setHasInitializedFavorites(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articlesResponse, hasInitializedFavorites]);

  const articles = articlesResponse?.articles ?? [];
  const categories = categoriesResponse ?? [];

  const handleLevelToggle = useCallback((level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level)
        ? prev.filter((item) => item !== level)
        : [...prev, level],
    );
  }, []);

  const handleCategoryToggle = useCallback((categoryId: number) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(categoryId);
      const updated = exists
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];

      if (updated.length > 0) {
        setActiveTab("categorias");
      }

      return updated;
    });
  }, []);

  const handleOpenCategories = useCallback(() => {
    if (activeTab === "categorias" && selectedCategories.length > 0) {
      bottomSheetRef.current?.expand();
    } else if (selectedCategories.length > 0) {
      setActiveTab("categorias");
    } else {
      bottomSheetRef.current?.expand();
    }
  }, [activeTab, selectedCategories]);

  const handleFavoriteToggle = useCallback(
    (article: StudentArticleListItem) => {
      const currentlyFavorite = isFavorite(article.id);
      
      // Optimistic update
      if (currentlyFavorite) {
        removeFavorite(article.id);
      } else {
        addFavorite(article.id);
      }

      toggleFavoriteMutation.mutate(
        {
          articleId: article.id,
          isFavorite: currentlyFavorite,
        },
        {
          onError: () => {
            // Revert on error
            if (currentlyFavorite) {
              addFavorite(article.id);
            } else {
              removeFavorite(article.id);
            }
          },
        },
      );
    },
    [toggleFavoriteMutation, addFavorite, removeFavorite, isFavorite],
  );

  const handleRefresh = useCallback(async () => {
    // Keep the initialization flag to prevent favorites from being reset
    await refetch();
  }, [refetch]);

  useEffect(() => {
    if (selectedCategories.length === 0 && activeTab === "categorias") {
      setActiveTab("todos");
    }
  }, [selectedCategories, activeTab]);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesSearch = normalizedQuery
        ? article.title.toLowerCase().includes(normalizedQuery) ||
          article.excerpt.toLowerCase().includes(normalizedQuery)
        : true;

      const matchesLevel =
        selectedLevels.length === 0 ||
        selectedLevels.includes(article.difficulty.label);

      const matchesCategory =
        selectedCategories.length === 0 ||
        (!!article.category &&
          selectedCategories.includes(article.category.id));

      if (!matchesSearch || !matchesLevel || !matchesCategory) {
        return false;
      }

      if (activeTab === "favoritos") {
        return article.isBookmarked || isFavorite(article.id);
      }

      if (activeTab === "lidos") {
        return (
          article.progress.isRead ||
          article.progress.readPercentage >= 100 ||
          isRead(article.id)
        );
      }

      if (activeTab === "categorias") {
        return selectedCategories.length === 0
          ? true
          : !!article.category &&
              selectedCategories.includes(article.category.id);
      }

      return true;
    });
  }, [
    articles,
    searchQuery,
    selectedLevels,
    selectedCategories,
    activeTab,
    isFavorite,
    isRead,
  ]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container className="flex-1 bg-gray-50">
        <View className="px-6 pt-4 pb-2">
          <WikiHeader />

          <WikiFilterTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onCategoriesPress={handleOpenCategories}
            selectedCategoriesCount={selectedCategories.length}
          />

          <WikiSearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={["#155DFC"]}
            />
          }
        >
          {isPending ? (
            <View className="py-16 items-center justify-center">
              <ActivityIndicator size="large" color="#155DFC" />
            </View>
          ) : isError ? (
            <View className="py-16 px-6">
              <Text className="text-center text-base text-red-500">
                Não foi possível carregar os artigos. Tente novamente em alguns
                instantes.
              </Text>
            </View>
          ) : (
            <WikiArticlesList
              articles={filteredArticles}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}
        </ScrollView>

        <CategoryFilterBottomSheet
          ref={bottomSheetRef}
          categories={categories}
          selectedLevels={selectedLevels}
          onLevelToggle={handleLevelToggle}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
        />
      </Container>
    </GestureHandlerRootView>
  );
}
