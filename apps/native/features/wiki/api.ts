import { client } from "@/lib/eden";
import type {
  StudentArticleDetail,
  StudentArticleListItem,
} from "@server/modules/wiki/types/article";
import type { SuccessResponse } from "@server/lib/responses";

type StudentArticlesResponse = SuccessResponse<{
  articles: StudentArticleListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>;

type StudentArticleDetailResponse = SuccessResponse<StudentArticleDetail>;

type StudentCategoriesResponse = SuccessResponse<
  Array<{
    id: number;
    name: string;
    slug: string;
    color: string;
    articleCount: number;
  }>
>;

export type StudentArticlesQuery = Partial<{
  page: number;
  limit: number;
  search: string;
}>;

function assertSuccess<T>(
  response: { data?: SuccessResponse<T>; error?: unknown } | undefined,
  fallbackMessage: string,
): T {
  if (!response) {
    throw new Error(fallbackMessage);
  }

  if ("error" in response && response.error) {
    const error = response.error as any;
    const message =
      typeof error === "string"
        ? error
        : error?.message ?? fallbackMessage;
    throw new Error(message);
  }

  if (!response.data || response.data.success !== true) {
    throw new Error(fallbackMessage);
  }

  return response.data.data;
}

export async function fetchStudentArticles(
  params?: StudentArticlesQuery,
): Promise<StudentArticlesResponse["data"]> {
  const response = await (params
    ? client.wiki.articles.get({ query: params })
    : client.wiki.articles.get());

  return assertSuccess<StudentArticlesResponse["data"]>(
    response,
    "Não foi possível carregar os artigos da wiki.",
  );
}

export async function fetchStudentArticleDetail(
  id: number,
): Promise<StudentArticleDetailResponse["data"]> {
  const response = await client.wiki.articles({ id }).get();

  return assertSuccess<StudentArticleDetailResponse["data"]>(
    response,
    "Não foi possível carregar o artigo selecionado.",
  );
}

export async function fetchStudentCategories(): Promise<
  StudentCategoriesResponse["data"]
> {
  const response = await client.wiki.categories.get();

  return assertSuccess<StudentCategoriesResponse["data"]>(
    response,
    "Não foi possível carregar as categorias da wiki.",
  );
}

export async function addFavorite(articleId: number) {
  const response = await client.wiki.articles({ id: articleId }).bookmark.post();

  return assertSuccess(response, "Não foi possível favoritar o artigo.");
}

export async function removeFavorite(articleId: number) {
  const response = await client.wiki
    .articles({ id: articleId })
    .bookmark.delete();

  return assertSuccess(response, "Não foi possível remover dos favoritos.");
}

export async function markArticleAsRead(articleId: number) {
  const response = await client.wiki.articles({ id: articleId })["mark-read"].post();

  return assertSuccess(
    response,
    "Não foi possível marcar o artigo como lido.",
  );
}

export async function markArticleAsUnread(articleId: number) {
  const response = await client.wiki.articles({ id: articleId })["mark-read"].delete();

  return assertSuccess(
    response,
    "Não foi possível marcar o artigo como não lido.",
  );
}
