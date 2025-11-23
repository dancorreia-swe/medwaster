import { BadRequestError } from "@/lib/errors";
import Elysia, { t } from "elysia";
import { ArticleService } from "./services/article-service";
import { contentScraperService } from "./services/content-scraper";
import { ExportService } from "./services/export.service";
import {
  createArticleSchema,
  updateArticleSchema,
  articleListQuerySchema,
} from "./types/article";
import { success } from "@/lib/responses";
import { betterAuthMacro } from "@/lib/auth";

export const adminArticles = new Elysia({
  prefix: "/articles",
  tags: ["Admin - Wiki Articles"],
  detail: {
    description:
      "Admin endpoints for managing wiki articles - full CRUD, publishing, and analytics",
  },
})
  .use(betterAuthMacro)
  .guard({
    auth: true,
    role: "admin",
    detail: {
      description: "Admin access required",
    },
  })
  .get(
    "/",
    async ({ query }) => {
      const result = await ArticleService.listArticles(query);

      return success(result);
    },
    {
      query: articleListQuerySchema,
      detail: {
        summary: "List all articles",
        description:
          "Retrieve a paginated list of all articles (any status: draft, published, archived). Supports filtering and searching.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .get(
    "/:id",
    async ({ params: { id } }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const article = await ArticleService.getArticleById(id);
      return success(article);
    },
    {
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      detail: {
        summary: "Get article by ID",
        description:
          "Retrieve a single article by its ID for editing or viewing. Includes all metadata and content.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .post(
    "/",
    async ({ body, user, status }) => {
      const article = await ArticleService.createArticle(body, user.id);
      return status("Created", success(article));
    },
    {
      body: createArticleSchema,
      detail: {
        summary: "Create new article",
        description:
          "Create a new article in draft status. Article must be published separately.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .put(
    "/:id",
    async ({ params: { id }, body, user }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const article = await ArticleService.updateArticle(id, body, user.id);
      return success(article);
    },
    {
      body: updateArticleSchema,
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      detail: {
        summary: "Update article",
        description:
          "Update an existing article. Can update content, metadata, category, and tags.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .put(
    "/:id/archive",
    async ({ params: { id } }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const result = await ArticleService.archiveArticle(id);
      return success(result);
    },
    {
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      detail: {
        summary: "Archive article",
        description:
          "Soft delete an article by archiving it. Archived articles are hidden from students but can be restored.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .delete(
    "/:id",
    async ({ params: { id } }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const result = await ArticleService.deleteArticle(id);
      return success(result);
    },
    {
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      detail: {
        summary: "Delete article",
        description:
          "Permanently delete an article and all its related data (tags, bookmarks, reading progress). This action cannot be undone.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .post(
    "/:id/publish",
    async ({ params }) => {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const article = await ArticleService.publishArticle(id);
      return success({
        article,
        publishedAt: new Date().toISOString(),
      });
    },
    {
      params: t.Object({
        id: t.String({ description: "Article ID" }),
      }),
      detail: {
        summary: "Publish article",
        description:
          "Publish a draft article, making it visible to students. Sets published status and timestamp.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .post(
    "/:id/unpublish",
    async ({ params }) => {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const article = await ArticleService.unpublishArticle(id);
      return success({
        article,
        unpublishedAt: new Date().toISOString(),
      });
    },
    {
      params: t.Object({
        id: t.String({ description: "Article ID" }),
      }),
      detail: {
        summary: "Unpublish article",
        description:
          "Unpublish an article, returning it to draft status and hiding it from students.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .get(
    "/:id/export/pdf",
    async ({ params, query, set }) => {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const exportOptions = {
        includeImages: query.includeImages !== "false",
        format: (query.format as "A4" | "Letter") || "A4",
      };

      const result = await ExportService.exportArticleToPDF(id, exportOptions);

      set.headers["content-type"] = result.mimeType;
      set.headers["content-disposition"] =
        `attachment; filename="${result.filename}"`;
      set.headers["content-length"] = result.size.toString();

      return result.buffer;
    },
    {
      params: t.Object({
        id: t.String({ description: "Article ID" }),
      }),
      query: t.Optional(
        t.Object({
          includeImages: t.Optional(
            t.String({ description: "Include images in PDF (default: true)" }),
          ),
          format: t.Optional(
            t.Union([t.Literal("A4"), t.Literal("Letter")], {
              description: "Paper format (default: A4)",
            }),
          ),
        }),
      ),
      detail: {
        summary: "Export article to PDF",
        description:
          "Export a single article as a PDF file for download. Supports customization of paper format and image inclusion.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .post(
    "/export/pdf",
    async ({ body, set }) => {
      if (!body.articleIds || body.articleIds.length === 0) {
        throw new BadRequestError("At least one article ID is required");
      }

      const exportOptions = {
        includeImages: body.includeImages !== false,
        format: body.format || ("A4" as const),
        title: body.title,
      };

      const result = await ExportService.exportMultipleArticlesToPDF(
        body.articleIds,
        exportOptions,
      );

      set.headers["content-type"] = result.mimeType;
      set.headers["content-disposition"] =
        `attachment; filename="${result.filename}"`;
      set.headers["content-length"] = result.size.toString();

      return result.buffer;
    },
    {
      body: t.Object({
        articleIds: t.Array(t.Number({ description: "Article ID" }), {
          minItems: 1,
          maxItems: 50,
          description: "Array of article IDs to export (1-50 articles)",
        }),
        includeImages: t.Optional(
          t.Boolean({ description: "Include images in PDF (default: true)" }),
        ),
        format: t.Optional(
          t.Union([t.Literal("A4"), t.Literal("Letter")], {
            description: "Paper format (default: A4)",
          }),
        ),
        title: t.Optional(
          t.String({
            maxLength: 200,
            description: "Custom title for the combined PDF",
          }),
        ),
      }),
      detail: {
        summary: "Export multiple articles to PDF",
        description:
          "Export multiple articles as a single combined PDF file. Maximum 50 articles per export.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  )

  .get(
    "/stats",
    async () => {
      const stats = await ArticleService.getStats();
      return success(stats);
    },
    {
      detail: {
        summary: "Get article statistics",
        description:
          "Retrieve global statistics for all articles including total count by status, most viewed, and recent activity.",
        tags: ["Admin - Wiki Articles"],
      },
    },
  );

// ============================================================================
// USER/STUDENT ROUTES - Reading, bookmarks, and progress tracking
// ============================================================================

export const userArticles = new Elysia({
  prefix: "/articles",
  tags: ["Student - Wiki Articles"],
  detail: {
    description:
      "Student endpoints for reading articles, managing bookmarks, and tracking reading progress",
  },
})
  .use(betterAuthMacro)
  .guard({
    auth: true,
  })
  .get(
    "/",
    async ({ query, user }) => {
      const result = await ArticleService.listPublishedArticles(
        query,
        user.id,
      );
      return success(result);
    },
    {
      query: articleListQuerySchema,
      detail: {
        summary: "List published articles",
        description:
          "Retrieve a paginated list of published articles available to students. Only shows published status articles.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )

  .get(
    "/:id",
    async ({ params: { id }, user }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const article = await ArticleService.getPublishedArticleById(id, user.id);
      return success(article);
    },
    {
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      detail: {
        summary: "Read article",
        description:
          "Retrieve a published article for reading. Automatically tracks view count and creates reading progress entry.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )
  .get(
    "/pdf-text",
    async ({ query }) => {
      const url = query.url?.trim();
      if (!url) {
        throw new BadRequestError("Missing url");
      }

      const result = await contentScraperService.extractPdfText(url);
      return success({
        content: result.content,
        title: result.title ?? null,
        numPages: result.numPages ?? null,
        length: result.content.length,
      });
    },
    {
      query: t.Object({
        url: t.String({ description: "PDF URL to extract text from" }),
      }),
      detail: {
        summary: "Extract PDF text",
        description: "Extract plain text from a PDF URL for reading aloud.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )

  .post(
    "/:id/bookmark",
    async ({ params: { id }, user }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const bookmark = await ArticleService.addBookmark(user.id, id);
      return success(bookmark);
    },
    {
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      detail: {
        summary: "Favorite article",
        description: "Add an article to your favorites for quick access.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )

  .delete(
    "/:id/bookmark",
    async ({ params: { id }, user }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      await ArticleService.removeBookmark(user.id, id);
      return success({ removed: true });
    },
    {
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      detail: {
        summary: "Unfavorite article",
        description: "Remove an article from your favorites.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )

  .get(
    "/bookmarks",
    async ({ user }) => {
      const bookmarks = await ArticleService.getUserBookmarks(user.id);
      return success(bookmarks);
    },
    {
      detail: {
        summary: "Get favorites",
        description: "Retrieve all your favorited articles.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )

  .put(
    "/:id/progress",
    async ({ params: { id }, body, user }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const progress = await ArticleService.updateReadProgress(
        user.id,
        id,
        body,
      );
      return success(progress);
    },
    {
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      body: t.Object({
        readPercentage: t.Number({
          minimum: 0,
          maximum: 100,
          description: "Percentage of article scrolled (0-100)",
        }),
        timeSpentSeconds: t.Number({
          minimum: 0,
          description: "Time spent reading in seconds",
        }),
      }),
      detail: {
        summary: "Update reading progress",
        description:
          "Update reading progress for an article. Automatically called as user scrolls through content.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )

  .post(
    "/:id/mark-read",
    async ({ params: { id }, user }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const progress = await ArticleService.markAsRead(user.id, id);
      return success(progress);
    },
    {
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      detail: {
        summary: "Mark article as read",
        description:
          "Manually mark an article as fully read. Sets read percentage to 100% and records completion timestamp.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )

  .delete(
    "/:id/mark-read",
    async ({ params: { id }, user }) => {
      if (isNaN(id)) {
        throw new BadRequestError("Invalid article ID");
      }

      const progress = await ArticleService.markAsUnread(user.id, id);
      return success(progress);
    },
    {
      params: t.Object({
        id: t.Number({ description: "Article ID" }),
      }),
      detail: {
        summary: "Mark article as unread",
        description:
          "Mark an article as unread. Resets read percentage to 0% and clears completion timestamp.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )

  .get(
    "/reading-list",
    async ({ user }) => {
      const articles = await ArticleService.getReadingList(user.id);
      return success(articles);
    },
    {
      detail: {
        summary: "Get reading list",
        description:
          "Retrieve articles that haven't been read yet or are in progress. Excludes fully read articles.",
        tags: ["Student - Wiki Articles"],
      },
    },
  )

  .get(
    "/reading-history",
    async ({ user }) => {
      const articles = await ArticleService.getReadingHistory(user.id);
      return success(articles);
    },
    {
      detail: {
        summary: "Get reading history",
        description:
          "Retrieve articles that have been marked as read, with timestamps and reading statistics.",
        tags: ["Student - Wiki Articles"],
      },
    },
  );
