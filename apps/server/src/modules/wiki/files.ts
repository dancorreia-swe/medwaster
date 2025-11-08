import { Elysia, t } from "elysia";
import { betterAuthMacro, ROLES } from "@/lib/auth";
import { WikiS3StorageService } from "./services/s3-storage.service";

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const wikiFiles = new Elysia({ prefix: "/files" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, (app) =>
    app
      .post(
        "/upload",
        async ({ body }) => {
          const result = await WikiS3StorageService.uploadFile(body.file);
          return {
            success: true,
            data: result,
          };
        },
        {
          body: t.Object({
            file: t.File({
              type: ALLOWED_MIME_TYPES,
              maxSize: MAX_FILE_SIZE,
            }),
          }),
          detail: {
            summary: "Upload wiki file",
            description: "Upload a file (image or document) for wiki articles to S3/MinIO (max 10MB)",
          },
        }
      )
      .delete(
        "/:key",
        async ({ params }) => {
          await WikiS3StorageService.deleteFile(params.key);
          return {
            success: true,
            message: "File deleted successfully",
          };
        },
        {
          params: t.Object({
            key: t.String(),
          }),
          detail: {
            summary: "Delete wiki file",
            description: "Delete a file from S3/MinIO storage",
          },
        }
      )
  );
