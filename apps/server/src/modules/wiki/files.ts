import { betterAuthMacro } from "@/lib/auth";
import { success, BadRequestError } from "@/lib/errors";
import Elysia, { t } from "elysia";
import { FileStorageService } from "./services/file-storage.service";

export const wikiFiles = new Elysia({ prefix: "/files" })
  .use(betterAuthMacro)
  .guard(
    {
      auth: true,
      role: ["admin", "super_admin"],
    },
    (app) =>
      app
        // Upload file
        .post(
          "/upload",
          async ({ body, user }) => {
            if (!body.file) {
              throw new BadRequestError("No file provided");
            }

            // Convert File to buffer and extract metadata
            const buffer = Buffer.from(await body.file.arrayBuffer());
            
            const fileData = {
              originalName: body.file.name,
              buffer,
              mimeType: body.file.type,
              size: body.file.size,
              uploadedBy: user.id,
              associatedArticleId: body.articleId,
            };

            const result = await FileStorageService.uploadFile(fileData);
            return success(result);
          },
          {
            body: t.Object({
              file: t.File({
                maxSize: 5 * 1024 * 1024, // 5MB
                type: [
                  "image/jpeg",
                  "image/png", 
                  "image/gif",
                  "image/webp",
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ]
              }),
              articleId: t.Optional(t.Number()),
            }),
          }
        )

        // Get file metadata
        .get("/:id/info", async ({ params }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new BadRequestError("Invalid file ID");
          }

          const file = await FileStorageService.getFileById(id);
          return success({
            id: file.id,
            originalName: file.originalName,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            uploadedBy: file.uploadedBy,
            associatedArticleId: file.associatedArticleId,
            createdAt: file.createdAt,
          });
        })

        // Associate file with article
        .post("/:id/associate", async ({ params, body }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new BadRequestError("Invalid file ID");
          }

          const file = await FileStorageService.associateWithArticle(id, body.articleId);
          return success(file);
        }, {
          body: t.Object({
            articleId: t.Number(),
          }),
        })

        // Delete file
        .delete("/:id", async ({ params, user }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new BadRequestError("Invalid file ID");
          }

          await FileStorageService.deleteFile(id, user.id);
          return success({ deleted: true, id });
        })

        // Get files by article
        .get("/by-article/:articleId", async ({ params }) => {
          const articleId = parseInt(params.articleId);
          if (isNaN(articleId)) {
            throw new BadRequestError("Invalid article ID");
          }

          const files = await FileStorageService.getFilesByArticleId(articleId);
          return success(files);
        })

        // Get orphaned files
        .get("/orphaned", async () => {
          const files = await FileStorageService.getOrphanedFiles();
          return success(files);
        })

        // Get storage statistics
        .get("/stats", async () => {
          const stats = await FileStorageService.getStorageStats();
          return success(stats);
        })

        // Cleanup orphaned files
        .post("/cleanup", async ({ body }) => {
          const deletedCount = await FileStorageService.cleanupOrphanedFiles(
            body?.olderThanDays || 7
          );
          return success({ deletedCount });
        }, {
          body: t.Optional(t.Object({
            olderThanDays: t.Optional(t.Number({ minimum: 1, maximum: 365 })),
          })),
        })
  )
  
  // Public file serving endpoint (no auth required)
  .get("/:id", async ({ params, set }) => {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      throw new BadRequestError("Invalid file ID");
    }

    const { file, content } = await FileStorageService.getFileContent(id);
    
    // Set appropriate headers
    set.headers["content-type"] = file.mimeType;
    set.headers["content-length"] = file.fileSize.toString();
    set.headers["content-disposition"] = `inline; filename="${file.originalName}"`;
    
    // Cache headers for static files
    set.headers["cache-control"] = "public, max-age=31536000"; // 1 year
    set.headers["etag"] = `"${file.id}-${file.updatedAt.getTime()}"`;
    
    return content;
  });