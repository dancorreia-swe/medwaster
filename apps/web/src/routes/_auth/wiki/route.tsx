import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useArticles,
  useCategories,
  useCreateArticle,
  useWikiStats,
} from "@/features/wiki/api/wikiQueries";
import { wrapRouteWithOutletIfNested } from "@/utils/router";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { Calendar, Clock, Eye, FileText, Loader2, Plus } from "lucide-react";
import { useState } from "react";

const STATUS_TABS = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
  { value: "archived", label: "Arquivados" },
];

export const Route = createFileRoute("/_auth/wiki")({
  beforeLoad: () => ({ getTitle: () => "Wiki" }),
  component: wrapRouteWithOutletIfNested(RouteComponent),
});

function RouteComponent() {
  const search = useSearch({ strict: false }) as {
    q?: string;
    status?: string;
    categoryId?: number;
  };
  const navigate = useNavigate();
  const [localQ, setLocalQ] = useState(search.q ?? "");
  const status = (search.status as string) ?? "all";

  const { data, isPending, isError } = useArticles({
    page: 1,
    limit: 12,
    status,
    categoryId: search.categoryId,
    search: search.q,
    sort: "updated_at",
    order: "desc",
  });

  const statsQuery = useWikiStats();
  const categoriesQuery = useCategories();

  const articles = data?.data?.data.articles ?? data?.data ?? [];

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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Base de Conhecimento
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Documentação, tópicos e artigos organizados como base de
            conhecimento para o aluno
          </p>
        </div>
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
          {isPending ? (
            <ArticleGridSkeleton />
          ) : isError ? (
            <div className="text-sm text-red-600">
              Erro ao carregar artigos.
            </div>
          ) : articles.length === 0 ? (
            <EmptyState />
          ) : (
            <ArticleGrid articles={articles} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const EMPTY_BLOCKNOTE_DOC = { type: "doc", content: [] } as const;
const DEFAULT_TITLE = "Novo artigo";

function NewArticleButton() {
  const navigate = useNavigate();
  const { mutateAsync: createArticle } = useCreateArticle();

  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setErrorMessage(null);

    try {
      const response = await createArticle({
        title: DEFAULT_TITLE,
        content: EMPTY_BLOCKNOTE_DOC,
        excerpt: "",
        status: "draft",
      } as any);

      const createdId = response?.data?.data.id;
      if (!createdId) {
        throw new Error(
          "Não foi possível obter o identificador do novo artigo.",
        );
      }

      navigate({
        to: "/wiki/$articleId",
        params: { articleId: String(createdId) },
      });
    } catch (error) {
      const fallback =
        error instanceof Error
          ? error.message
          : "Falha ao criar rascunho. Tente novamente.";
      setErrorMessage(fallback);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        {isCreating ? "Criando..." : "Novo artigo"}
      </Button>
      {errorMessage && (
        <span className="text-xs text-destructive">{errorMessage}</span>
      )}
    </div>
  );
}

function ArticleGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ArticleGrid({ articles }: { articles: any[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}

function statusBadgeVariant(status?: string) {
  switch (status) {
    case "published":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "archived":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

function ArticleCard({ article }: { article: any }) {
  return (
    <Card className="group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2 flex-1">
            {article.title}
          </CardTitle>
          <Badge
            variant={statusBadgeVariant(article.status)}
            className="shrink-0 capitalize"
          >
            {article.status === "draft"
              ? "Rascunho"
              : article.status === "published"
                ? "Publicado"
                : "Arquivado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p className="line-clamp-3 min-h-[3.75rem]">
          {article.excerpt || "Sem resumo disponível."}
        </p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {article.readingTimeMinutes || 0}{" "}
            min
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {article.viewCount || 0}
          </span>
          {article.updatedAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />{" "}
              {new Date(article.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="pt-2">
          <Button
            asChild
            variant="ghost"
            className="px-0 text-blue-600 hover:text-blue-700"
          >
            <Link to={`/wiki/$articleId`} params={{ articleId: article.id }}>
              <FileText className="mr-2 h-4 w-4" /> Abrir artigo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="border rounded-lg p-10 text-center">
      <h3 className="text-lg font-semibold">Nenhum artigo encontrado</h3>
      <p className="text-sm text-slate-600 mt-1">
        Tente alterar os filtros ou criar um novo artigo.
      </p>
      <Button asChild className="mt-4">
        <Link to="/wiki/articles/new">
          <Plus className="mr-2 h-4 w-4" /> Um novo artigo
        </Link>
      </Button>
    </div>
  );
}
