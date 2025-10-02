import { client } from "@/lib/client";
import { treaty } from "@elysiajs/eden";
import type { App } from "@server/index";

// Wiki articles API
export const wikiApi = {
  // Articles endpoints
  articles: {
    // List articles with filtering and pagination
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      categoryId?: number;
      authorId?: string;
      search?: string;
      sort?: string;
      order?: string;
    }) => {
      const result = await client.wiki.articles.get({
        query: params,
      });
      return result;
    },

    // Get single article by ID
    get: async (id: number) => {
      const result = await client.wiki.articles({ id: id.toString() }).get();
      return result;
    },

    // Create new article
    create: async (data: {
      title: string;
      slug?: string;
      content: any; // BlockNote content
      excerpt?: string;
      categoryId?: number;
      tagIds?: number[];
      status: "draft" | "published";
      featuredImageUrl?: string;
      metaDescription?: string;
    }) => {
      const result = await client.wiki.articles.post(data);
      return result;
    },

    // Update existing article
    update: async (
      id: number,
      data: {
        title?: string;
        slug?: string;
        content?: any;
        excerpt?: string;
        categoryId?: number;
        tagIds?: number[];
        status?: "draft" | "published";
        featuredImageUrl?: string;
        metaDescription?: string;
      },
    ) => {
      const result = await client.wiki.articles({ id: id.toString() }).put(data);
      return result;
    },

    // Delete article
    delete: async (id: number) => {
      const result = await client.wiki.articles({ id: id.toString() }).delete();
      return result;
    },

    // Publish article
    publish: async (id: number) => {
      const result = await client.wiki
        .articles({ id: id.toString() })
        .publish.post();
      return result;
    },

    // Unpublish article
    unpublish: async (id: number) => {
      const result = await client.wiki
        .articles({ id: id.toString() })
        .unpublish.post();
      return result;
    },

    // Export article to PDF
    exportPdf: async (
      id: number,
      options?: {
        includeImages?: boolean;
        format?: "A4" | "Letter";
      },
    ) => {
      const result = await client.wiki
        .articles({ id: id.toString() })
        .export.pdf.get({
          query: options,
        });
      return result;
    },

    // Bulk export articles to PDF
    bulkExportPdf: async (data: {
      articleIds: number[];
      includeImages?: boolean;
      format?: "A4" | "Letter";
      title?: string;
    }) => {
      const result = await client.wiki.articles.export.pdf.post(data);
      return result;
    },
  },

  // Files endpoints
  files: {
    // List files
    list: async (params?: {
      page?: number;
      limit?: number;
      articleId?: number;
      mimeType?: string;
    }) => {
      const result = await client.wiki.files.get({
        query: params,
      });
      return result;
    },

    // Upload file
    upload: async (file: File, articleId?: number) => {
      const formData = new FormData();
      formData.append("file", file);
      if (articleId) {
        formData.append("articleId", articleId.toString());
      }

      // Note: Eden Treaty doesn't handle FormData directly, so we use fetch
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

    // Get file by ID (serves the file)
    get: async (id: number) => {
      const result = await client.wiki.files({ id: id.toString() }).get();
      return result;
    },

    // Delete file
    delete: async (id: number) => {
      const result = await client.wiki.files({ id: id.toString() }).delete();
      return result;
    },
  },

  // Categories (from questions module but used by wiki)
  categories: {
    list: async () => {
      const result = await client.questions.categories.get();
      return result;
    },
  },

  // Tags (from questions module but used by wiki)
  tags: {
    list: async () => {
      const result = await client.questions.tags.get();
      return result;
    },
  },
};

export default wikiApi;

