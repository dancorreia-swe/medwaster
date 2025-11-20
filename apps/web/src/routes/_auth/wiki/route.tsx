import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, X, ChevronDown } from "lucide-react";
import {
  articlesQueryOptions,
  categoriesQueryOptions,
  useArticles,
  useCategories,
  useWikiStats,
  wikiQueryKeys,
  wikiStatsQueryOptions,
  useTags,
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
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Wiki";

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
  tags?: string[];
};

export const Route = createFileRoute("/_auth/wiki")({
  validateSearch: (search: Record<string, unknown>): WikiSearchParams => {
    return {
      q: search.q as string | undefined,
      status: search.status as string | undefined,
      categoryId: search.categoryId ? Number(search.categoryId) : undefined,
      tags: search.tags as string | undefined,
    };
  },
  loaderDeps: ({ search }) => ({
    status: search.status,
    categoryId: search.categoryId,
    q: search.q,
    tags: search.tags,
  }),
  loader: async ({ context: { queryClient }, deps }) => {
    const status = (deps.status as string) ?? "all";

    // Only prefetch articles on initial load - use cached data on subsequent visits
    // The component will handle refetching via React Query's staleTime
    const tags = deps.tags;
    
    const articlesKey = articlesQueryOptions({
      page: 1,
      limit: 12,
      status,
      categoryId: deps.categoryId || undefined,
      search: deps.q,
      tags,
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
          tags,
          sort: "updated_at",
          order: "desc",
        }),
      );
    }

    // Categories and stats are cached for 30min, no need to refetch often
    queryClient.prefetchQuery(categoriesQueryOptions());
    queryClient.prefetchQuery(wikiStatsQueryOptions());
  },
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
  component: wrapRouteWithOutletIfNested(RouteComponent),
});

function RouteComponent() {
  const search = useSearch({ from: "/_auth/wiki" });
  const navigate = useNavigate();
  const [localQ, setLocalQ] = useState(search.q ?? "");
  const debouncedQ = useDebounce(localQ, 400);
  const status = (search.status as string) ?? "all";

  // Data is preloaded by loader - these hooks return cached data instantly
  const tags = search.tags;
  
  const articlesQuery = useArticles({
    page: 1,
    limit: 12,
    status,
    categoryId: search.categoryId || undefined,
    search: search.q,
    tags,
    sort: "updated_at",
    order: "desc",
  });

  const statsQuery = useWikiStats();
  const categoriesQuery = useCategories();
  const tagsQuery = useTags();

  const articles =
    articlesQuery.isSuccess && articlesQuery.data?.data?.data?.articles
      ? articlesQuery.data.data.data.articles
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/wiki",
      replace: true,
      search: (prev: any) => ({ 
        ...prev, 
        q: localQ || undefined,
      }),
    });
  };

  useEffect(() => {
    if ((search.q ?? "") === (debouncedQ ?? "")) {
      return;
    }

    navigate({
      to: "/wiki",
      replace: true,
      search: (prev: any) => ({
        ...prev,
        q: debouncedQ || undefined,
      }),
    });
  }, [debouncedQ, navigate, search.q]);

  const handleTagToggle = (tagName: string) => {
    const currentTags = search.tags || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName];
    
    navigate({
      to: "/wiki",
      replace: true,
      search: (prev: any) => ({
        ...prev,
        tags: newTags.length > 0 ? newTags : undefined,
      }),
    });
  };

  const handleRemoveTag = (tagName: string) => {
    const newTags = (search.tags || []).filter(t => t !== tagName);
    navigate({
      to: "/wiki",
      replace: true,
      search: (prev: any) => ({
        ...prev,
        tags: newTags.length > 0 ? newTags : undefined,
      }),
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
      <div className="space-y-3">
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
                  <SelectItem value="__loading" disabled>
                    Carregando...
                  </SelectItem>
                ) : categoriesQuery.data && categoriesQuery.data.length > 0 ? (
                  categoriesQuery.data.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__empty" disabled>
                    Nenhuma categoria disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Tags Filter Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                  {search.tags && search.tags.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 rounded-full px-1.5 py-0 text-xs"
                    >
                      {search.tags.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Filtrar por Tags</h4>
                    <p className="text-xs text-muted-foreground">
                      Selecione as tags para filtrar os artigos
                    </p>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tagsQuery.isPending ? (
                      <div className="p-2 text-sm text-zinc-500">Carregando...</div>
                    ) : tagsQuery.data?.data && tagsQuery.data.data.length > 0 ? (
                      tagsQuery.data.data.map((tag: any) => {
                        const selectedTags = search.tags || [];
                        const isChecked = selectedTags.includes(tag.name);

                        return (
                          <label
                            key={tag.id}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleTagToggle(tag.name)}
                            />
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: tag.color || "#6b7280",
                                }}
                              />
                              {tag.name}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="p-2 text-sm text-zinc-500">
                        Nenhuma tag disponível
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Tags Display */}
        {search.tags && search.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Tags ativas:</span>
            {search.tags.map((tagName) => (
              <Badge key={tagName} variant="secondary" className="gap-1">
                {tagName}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveTag(tagName)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
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
