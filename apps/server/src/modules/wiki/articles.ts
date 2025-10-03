import { betterAuthMacro } from "@/lib/auth";
import { BadRequestError } from "@/lib/errors";
import Elysia, { t } from "elysia";
import { ArticleService } from "./services/article-service";
import { ExportService } from "./services/export.service";
import {
  createArticleSchema,
  updateArticleSchema,
  articleListQuerySchema,
} from "./types/article";
import { success } from "@/lib/responses";

export const wikiArticles = new Elysia({ prefix: "/articles" })
  .use(betterAuthMacro)
  .guard(
    {
      auth: true,
      role: ["admin", "super_admin"],
    },
    (app) =>
      app
        // List articles with filtering and pagination
        .get(
          "/",
          async ({ query }) => {
            const result = await ArticleService.listArticles(query);

            return success(result);
          },
          {
            query: articleListQuerySchema,
          },
        )

        .get(
          "/:id",
          async ({ params: { id } }) => {
            if (isNaN(id)) {
              throw new Error("Invalid article ID");
            }

            const article = await ArticleService.getArticleById(id);

            return success(article);
          },
          {
            params: t.Object({
              id: t.Number(),
            }),
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
          },
        )

        // Update existing article
        .put(
          "/:id",
          async ({ params: { id }, body, user }) => {
            if (isNaN(id)) {
              throw new Error("Invalid article ID");
            }

            const article = await ArticleService.updateArticle(
              id,
              body,
              user.id,
            );

            return success(article);
          },
          {
            body: updateArticleSchema,
            params: t.Object({
              id: t.Number(),
            }),
          },
        )

        .delete(
          "/:id",
          async ({ params: { id }, status }) => {
            if (isNaN(id)) {
              throw new Error("Invalid article ID");
            }

            const result = await ArticleService.archiveArticle(id);
            return status("No Content", success(result));
          },
          {
            params: t.Object({
              id: t.Number(),
            }),
          },
        )

        .post(
          "/:id/publish",
          async ({ params }) => {
            const id = parseInt(params.id);
            if (isNaN(id)) {
              throw new Error("Invalid article ID");
            }

            const article = await ArticleService.publishArticle(id);
            return success({
              article,
              publishedAt: new Date().toISOString(),
            });
          },
          {
            params: t.Object({
              id: t.String(),
            }),
          },
        )

        // Unpublish article
        .post("/:id/unpublish", async ({ params }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new Error("Invalid article ID");
          }

          const article = await ArticleService.unpublishArticle(id);
          return success({
            article,
            unpublishedAt: new Date().toISOString(),
          });
        })

        // Export single article to PDF
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

            const result = await ExportService.exportArticleToPDF(
              id,
              exportOptions,
            );

            // Set response headers for file download
            set.headers["content-type"] = result.mimeType;
            set.headers["content-disposition"] =
              `attachment; filename="${result.filename}"`;
            set.headers["content-length"] = result.size.toString();

            return result.buffer;
          },
          {
            query: t.Optional(
              t.Object({
                includeImages: t.Optional(t.String()),
                format: t.Optional(
                  t.Union([t.Literal("A4"), t.Literal("Letter")]),
                ),
              }),
            ),
          },
        )

        // Export multiple articles to PDF
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

            // Set response headers for file download
            set.headers["content-type"] = result.mimeType;
            set.headers["content-disposition"] =
              `attachment; filename="${result.filename}"`;
            set.headers["content-length"] = result.size.toString();

            return result.buffer;
          },
          {
            body: t.Object({
              articleIds: t.Array(t.Number(), { minItems: 1, maxItems: 50 }),
              includeImages: t.Optional(t.Boolean()),
              format: t.Optional(
                t.Union([t.Literal("A4"), t.Literal("Letter")]),
              ),
              title: t.Optional(t.String({ maxLength: 200 })),
            }),
          },
        )

        // Global stats for articles
        .get("/stats", async () => {
          const stats = await ArticleService.getStats();
          return success(stats);
        }),

    // TODO: Bulk operations endpoint will be implemented in Phase 3
    // .post("/bulk", async ({ body, user }) => { ... }, { body: bulkOperationSchema })
  );
