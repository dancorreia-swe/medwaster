import { ArticleCard } from "./article-card";
import type { ArticleCardArticle } from "./article-card";

interface ArticleGridProps {
  articles: ArticleCardArticle[];
}

export function ArticleGrid({ articles }: ArticleGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}
