import { View, Text } from "react-native";
import { ArticleCard } from "./article-card";
import { useRouter } from "expo-router";
import { useArticleStore } from "@/lib/stores/article-store";
import type { StudentArticleListItem } from "@server/modules/wiki/types/article";

interface WikiArticlesListProps {
  articles: StudentArticleListItem[];
  onFavoriteToggle: (article: StudentArticleListItem) => void;
}

export function WikiArticlesList({
  articles,
  onFavoriteToggle,
}: WikiArticlesListProps) {
  const router = useRouter();
  const readArticles = useArticleStore((state) => state.readArticles);
  const unreadArticles = useArticleStore((state) => state.unreadArticles);
  const favoriteArticles = useArticleStore((state) => state.favoriteArticles);

  if (articles.length === 0) {
    return (
      <View className="px-6 pt-16 pb-20 items-center">
        <Text className="text-base text-gray-500 text-center">
          Nenhum artigo encontrado com os filtros selecionados.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-6 pt-6 pb-8 gap-4">
      {articles.map((article) => {
        // If explicitly marked as unread, show as unread
        if (unreadArticles.has(article.id)) {
          return (
            <ArticleCard
              key={article.id}
              title={article.title}
              excerpt={article.excerpt}
              icon={article.icon}
              categoryName={article.category?.name}
              categoryColor={article.category?.color}
              difficultyLabel={article.difficulty.label}
              difficultyColor={article.difficulty.color}
              readingTimeMinutes={article.readingTimeMinutes}
              isFavorite={favoriteArticles.has(article.id)}
              isRead={false}
              onFavoriteToggle={() => onFavoriteToggle(article)}
              onPress={() => router.push(`/article/${article.id}`)}
            />
          );
        }

        const isArticleRead =
          article.progress?.isRead ||
          (article.progress?.readPercentage ?? 0) >= 100 ||
          readArticles.has(article.id);

        return (
          <ArticleCard
            key={article.id}
            title={article.title}
            excerpt={article.excerpt}
            icon={article.icon}
            categoryName={article.category?.name}
            categoryColor={article.category?.color}
            difficultyLabel={article.difficulty.label}
            difficultyColor={article.difficulty.color}
            readingTimeMinutes={article.readingTimeMinutes}
            isFavorite={favoriteArticles.has(article.id)}
            isRead={isArticleRead}
            onFavoriteToggle={() => onFavoriteToggle(article)}
            onPress={() => router.push(`/article/${article.id}`)}
          />
        );
      })}
    </View>
  );
}
