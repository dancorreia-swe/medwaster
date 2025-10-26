import { client } from "@/lib/client";

type ArticleResource = ReturnType<typeof client.admin.wiki.articles>;
type ArticlesGetParams = Parameters<typeof client.admin.wiki.articles.get>[0];
type ArticleListQuery = ArticlesGetParams extends { query?: infer Q }
  ? Q
  : undefined;

const toArticleResource = (id: number) =>
  client.admin.wiki.articles({ id: id.toString() });

export const wikiApi = {
  listArticles: (query?: ArticleListQuery) =>
    query
      ? client.admin.wiki.articles.get({ query })
      : client.admin.wiki.articles.get(),

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

  listCategories: () => client.categories.get(),

  listTags: () => client.admin.tags.get(),
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
export type ArticleListQueryParams = ArticleListQuery;
