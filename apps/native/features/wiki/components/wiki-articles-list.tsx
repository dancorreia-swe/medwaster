import { View } from "react-native";
import { ArticleCard } from "./article-card";

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
}

export function WikiArticlesList({ articles }: WikiArticlesListProps) {
  return (
    <View className="px-5 pt-5 pb-6 gap-3">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          emoji={article.emoji}
          title={article.title}
          description={article.description}
          level={article.level}
          duration={article.duration}
        />
      ))}
    </View>
  );
}
