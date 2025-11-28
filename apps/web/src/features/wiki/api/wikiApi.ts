import { client } from "@/lib/client";

type ArticleResource = ReturnType<typeof client.admin.wiki.articles>;
type ArticlesGetParams = Parameters<typeof client.admin.wiki.articles.get>[0];
type ArticleListQuery = ArticlesGetParams extends { query?: infer Q }
  ? Q
  : undefined;

type ArticleListQueryWithOffset = ArticleListQuery & {
  offset?: number;
};

const toArticleResource = (id: number) =>
  client.admin.wiki.articles({ id: id.toString() });

export const wikiApi = {
  listArticles: (query?: ArticleListQueryWithOffset) => {
    if (!query) return client.admin.wiki.articles.get();

    const { offset, limit, ...rest } = query;
    const page =
      query.page ??
      (offset !== undefined && limit
        ? Math.floor(offset / limit) + 1
        : undefined);

    return client.admin.wiki.articles.get({
      query: {
        ...rest,
        limit,
        page,
      },
    });
  },

  getStats: () => client.admin.wiki.articles.stats.get(),

  getArticle: (id: number) => toArticleResource(id).get(),

  createArticle: (
    body: Parameters<typeof client.admin.wiki.articles.post>[0],
  ) => client.admin.wiki.articles.post(body),

  updateArticle: (id: number, body: Parameters<ArticleResource["put"]>[0]) =>
    toArticleResource(id).put(body),

  archiveArticle: (id: number) => toArticleResource(id).archive.put(),

  deleteArticle: (id: number) => toArticleResource(id).delete(),

  publishArticle: (id: number) => toArticleResource(id).publish.post(),

  unpublishArticle: (id: number) => toArticleResource(id).unpublish.post(),

  listCategories: async () => {
    const response = await client.admin.categories.get();
    return response.data;
  },

  listTags: async (query?: { search?: string }) => {
    const response = query
      ? await client.admin.tags.get({ query })
      : await client.admin.tags.get();
    return response.data;
  },

  createTag: async (body: { name: string; slug: string; description?: string; color?: string }) => {
    const response = await client.admin.tags.post(body);
    return response.data;
  },
};

export type ListArticlesResponse = Awaited<
  ReturnType<typeof wikiApi.listArticles>
>;
export type GetArticleResponse = Awaited<ReturnType<typeof wikiApi.getArticle>>;
export type CreateArticleResponse = Awaited<
  ReturnType<typeof wikiApi.createArticle>
>;
export type UpdateArticleResponse = Awaited<
  ReturnType<typeof wikiApi.updateArticle>
>;
export type ArticleListQueryParams = ArticleListQueryWithOffset;
