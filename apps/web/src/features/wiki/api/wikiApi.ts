import { client } from "@/lib/client";

type ArticleResource = ReturnType<typeof client.wiki.articles>;
type FileResource = ReturnType<typeof client.wiki.files>;
type ArticlesGetParams = Parameters<typeof client.wiki.articles.get>[0];
type ArticleListQuery = ArticlesGetParams extends { query?: infer Q } ? Q : undefined;
type FilesGetParams = Parameters<typeof client.wiki.files.get>[0];
type FileListQuery = FilesGetParams extends { query?: infer Q } ? Q : undefined;
type ExportPdfParams = Parameters<ArticleResource["export"]["pdf"]["get"]>[0];
type ExportPdfQuery = ExportPdfParams extends { query?: infer Q } ? Q : undefined;

const toArticleResource = (id: number) => client.wiki.articles({ id: id.toString() });
const toFileResource = (id: number) => client.wiki.files({ id: id.toString() });

export const wikiApi = {
  listArticles: (query?: ArticleListQuery) =>
    query ? client.wiki.articles.get({ query }) : client.wiki.articles.get(),

  getStats: () => client.wiki.articles.stats.get(),

  getArticle: (id: number) => toArticleResource(id).get(),

  createArticle: (body: Parameters<typeof client.wiki.articles.post>[0]) =>
    client.wiki.articles.post(body),

  updateArticle: (
    id: number,
    body: Parameters<ArticleResource["put"]>[0],
  ) => toArticleResource(id).put(body),

  deleteArticle: (id: number) => toArticleResource(id).delete(),

  publishArticle: (id: number) => toArticleResource(id).publish.post(),

  unpublishArticle: (id: number) => toArticleResource(id).unpublish.post(),

  exportArticlePdf: (id: number, query?: ExportPdfQuery) => {
    const resource = toArticleResource(id);
    return query ? resource.export.pdf.get({ query }) : resource.export.pdf.get();
  },

  bulkExportPdf: (
    body: Parameters<typeof client.wiki.articles.export.pdf.post>[0],
  ) => client.wiki.articles.export.pdf.post(body),

  listFiles: (query?: FileListQuery) =>
    query ? client.wiki.files.get({ query }) : client.wiki.files.get(),

  getFile: (id: number) => toFileResource(id).get(),

  deleteFile: (id: number) => toFileResource(id).delete(),

  uploadFile: async (file: File, articleId?: number) => {
    const formData = new FormData();
    formData.append("file", file);
    if (articleId) {
      formData.append("articleId", articleId.toString());
    }

    const response = await fetch("/client/wiki/files/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  listCategories: () => client.questions.categories.get(),

  listTags: () => client.questions.tags.get(),
};

export type ListArticlesResponse = Awaited<ReturnType<typeof wikiApi.listArticles>>;
export type GetArticleResponse = Awaited<ReturnType<typeof wikiApi.getArticle>>;
export type CreateArticleResponse = Awaited<ReturnType<typeof wikiApi.createArticle>>;
export type UpdateArticleResponse = Awaited<ReturnType<typeof wikiApi.updateArticle>>;
export type ArticleListQueryParams = ArticleListQuery;
export type FileListQueryParams = FileListQuery;
