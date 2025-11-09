import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  articlesQueryOptions,
  categoriesQueryOptions,
  useArticles,
  useCategories,
  useWikiStats,
  wikiQueryKeys,
  wikiStatsQueryOptions,
} from "@/features/wiki/api/wikiQueries";
import {
  ArticleGrid,
  ArticleGridSkeleton,
  EmptyState,
  NewArticleButton,
} from "@/features/wiki/components";
import { wrapRouteWithOutletIfNested } from "@/utils/router";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState } from "react";

const STATUS_TABS = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
  { value: "archived", label: "Arquivados" },
];

const ARTICLE_STATES = {
  pending: ArticleGridSkeleton,
  error: () => (
    <div className="text-sm text-red-600">Erro ao carregar artigos.</div>
  ),
  empty: EmptyState,
  success: ArticleGrid,
} as const;

type WikiSearchParams = {
  q?: string;
  status?: string;
  categoryId?: number;
};

export const Route = createFileRoute("/_auth/wiki")({
  validateSearch: (search: Record<string, unknown>): WikiSearchParams => {
    return {
      q: search.q as string | undefined,
      status: search.status as string | undefined,
      categoryId: search.categoryId ? Number(search.categoryId) : undefined,
    };
  },
  loaderDeps: ({ search }) => ({
    status: search.status,
    categoryId: search.categoryId,
    q: search.q,
  }),
  loader: async ({ context: { queryClient }, deps }) => {
    const status = (deps.status as string) ?? "all";

    // Only prefetch articles on initial load - use cached data on subsequent visits
    // The component will handle refetching via React Query's staleTime
    const articlesKey = articlesQueryOptions({
      page: 1,
      limit: 12,
      status,
      categoryId: deps.categoryId || undefined,
      search: deps.q,
      sort: "updated_at",
      order: "desc",
    }).queryKey;

    const hasData = queryClient.getQueryData(articlesKey);

    if (!hasData) {
      await queryClient.prefetchQuery(
        articlesQueryOptions({
          page: 1,
          limit: 12,
          status,
          categoryId: deps.categoryId || undefined,
          search: deps.q,
          sort: "updated_at",
          order: "desc",
        }),
      );
    }

    // Categories and stats are cached for 30min, no need to refetch often
    queryClient.prefetchQuery(categoriesQueryOptions());
    queryClient.prefetchQuery(wikiStatsQueryOptions());
  },
  beforeLoad: () => ({ getTitle: () => "Wiki" }),
  component: wrapRouteWithOutletIfNested(RouteComponent),
});

function RouteComponent() {
  const search = useSearch({ from: "/_auth/wiki" });
  const navigate = useNavigate();
  const [localQ, setLocalQ] = useState(search.q ?? "");
  const status = (search.status as string) ?? "all";

  // Data is preloaded by loader - these hooks return cached data instantly
  const articlesQuery = useArticles({
    page: 1,
    limit: 12,
    status,
    categoryId: search.categoryId || undefined,
    search: search.q,
    sort: "updated_at",
    order: "desc",
  });

  const statsQuery = useWikiStats();
  const categoriesQuery = useCategories();

  const articles =
    articlesQuery.isSuccess && articlesQuery.data?.data?.data?.articles
      ? articlesQuery.data.data.data.articles
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/wiki",
      replace: true,
      search: (prev: any) => ({ ...prev, q: localQ || undefined }),
    });
  };

  const handleTabChange = (val: string) => {
    navigate({
      to: "/wiki",
      replace: true,
      search: (prev: any) => ({
        ...prev,
        status: val === "all" ? undefined : val,
      }),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold">
            Base de Conhecimento
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Documentação, tópicos e artigos organizados como base de
            conhecimento para o aluno
          </p>
        </header>
        <NewArticleButton />
      </div>

      {/* Filters + Search */}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex gap-2 w-full flex-1"
        >
          <Input
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Buscar artigos..."
            className="w-full h-10"
          />
        </form>
        <div className="flex gap-2 items-center shrink-0">
          <Select
            value={search.categoryId ? String(search.categoryId) : "default"}
            onValueChange={(val) =>
              navigate({
                to: "/wiki",
                replace: true,
                search: (prev: any) => ({
                  ...prev,
                  categoryId: val === "default" ? undefined : Number(val),
                }),
              })
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Todas as categorias</SelectItem>
              {categoriesQuery.isPending ? (
                <div className="p-2 text-sm text-zinc-500">Carregando...</div>
              ) : (
                categoriesQuery.data?.data?.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs by status */}
      <Tabs value={status} onValueChange={handleTabChange}>
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={status} className="mt-4">
          {(() => {
            const state = articlesQuery.isPending
              ? "pending"
              : articlesQuery.isError
                ? "error"
                : articlesQuery.isSuccess && articles.length === 0
                  ? "empty"
                  : "success";

            const Component = ARTICLE_STATES[state];
            return <Component articles={articles} />;
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
