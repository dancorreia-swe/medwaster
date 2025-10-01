import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/features/wiki/api/articles";
import { ArticlesTable } from "@/features/wiki/components/articles-table";
import { ArticleFilters } from "@/features/wiki/components/article-filters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/admin/wiki/articles/")({
  component: ArticlesPage,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(articlesQueryOptions()),
});

function ArticlesPage() {
  const { data } = useSuspenseQuery(articlesQueryOptions());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Articles</h1>
          <p className="text-slate-600 mt-1">
            Manage your educational content and knowledge base articles
          </p>
        </div>
        <Link to="/admin/wiki/articles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Button>
        </Link>
      </div>
      
      <ArticleFilters />
      <ArticlesTable articles={data.articles || []} />
    </div>
  );
}