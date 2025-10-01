import { betterAuthMacro } from "@/lib/auth";
import { success, NotFoundError } from "@/lib/errors";
import Elysia from "elysia";
import { ArticleService } from "./services/article-service";
import {
  createArticleSchema,
  updateArticleSchema,
  articleListQuerySchema,
} from "./types/article";

export const wikiArticles = new Elysia({ prefix: "/articles" })
  .use(betterAuthMacro)
  // Note: Global error handler is already applied at app level
  .guard(
    {
      auth: true,
      role: ["admin", "super_admin"], // Allow both admin and super_admin
    },
    (app) =>
      app
        // List articles with filtering and pagination
        .get(
          "/",
          async ({ query, user }) => {
            const result = await ArticleService.listArticles(query);
            return success(result);
          },
          {
            query: articleListQuerySchema,
          },
        )

        // Get single article by ID
        .get("/:id", async ({ params }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new Error("Invalid article ID"); // This will be caught by global error handler
          }

          const article = await ArticleService.getArticleById(id);
          return success(article);
        })

        // Create new article
        .post(
          "/",
          async ({ body, user }) => {
            // user.id is guaranteed to exist due to auth: true guard
            const article = await ArticleService.createArticle(body, user.id);
            return success(article);
          },
          {
            body: createArticleSchema,
          },
        )

        // Update existing article
        .put(
          "/:id",
          async ({ params, body, user }) => {
            const id = parseInt(params.id);
            if (isNaN(id)) {
              throw new Error("Invalid article ID");
            }

            // user.id is guaranteed to exist due to auth: true guard
            const article = await ArticleService.updateArticle(
              id,
              body,
              user.id,
            );
            return success(article);
          },
          {
            body: updateArticleSchema,
          },
        )

        // Archive article (soft delete)
        .delete("/:id", async ({ params }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new Error("Invalid article ID");
          }

          const result = await ArticleService.archiveArticle(id);
          return success(result);
        })

        // Publish article
        .post("/:id/publish", async ({ params }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new Error("Invalid article ID");
          }

          const article = await ArticleService.publishArticle(id);
          return success({
            article,
            publishedAt: new Date().toISOString(),
          });
        })

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
        }),

    // TODO: Bulk operations endpoint will be implemented in Phase 3
    // .post("/bulk", async ({ body, user }) => { ... }, { body: bulkOperationSchema })
  );
