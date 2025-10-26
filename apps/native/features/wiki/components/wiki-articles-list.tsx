import { View } from "react-native";
import { ArticleCard } from "./article-card";
import { useRouter } from "expo-router";
import { useArticleStore } from "@/lib/stores/article-store";

export interface Article {
  id: string;
  emoji: string;
  title: string;
  description: string;
  level: string;
  duration: string;
}

interface WikiArticlesListProps {
  articles: Article[];
  favoriteIds?: string[];
  onFavoriteToggle: (articleId: string) => void;
}

export function WikiArticlesList({ 
  articles, 
  onFavoriteToggle 
}: WikiArticlesListProps) {
  const router = useRouter();
  const { isFavorite } = useArticleStore();

  return (
    <View className="px-6 pt-6 pb-8 gap-4">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          emoji={article.emoji}
          title={article.title}
          description={article.description}
          level={article.level}
          duration={article.duration}
          isFavorite={isFavorite(article.id)}
          onFavoriteToggle={() => onFavoriteToggle(article.id)}
          onPress={() => router.push(`/article/${article.id}`)}
        />
      ))}
    </View>
  );
}
