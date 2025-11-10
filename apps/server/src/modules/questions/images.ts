import { Elysia, t } from "elysia";
import { betterAuthMacro, ROLES } from "@/lib/auth";
import { S3StorageService } from "./s3-storage.service";

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export const questionImages = new Elysia({ prefix: "/images" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, (app) =>
    app
      .post(
        "/upload",
        async ({ body }) => {
          const result = await S3StorageService.uploadImage(body.image);
          return {
            success: true,
            data: result,
          };
        },
        {
          body: t.Object({
            image: t.File({
              type: ALLOWED_MIME_TYPES,
              maxSize: MAX_FILE_SIZE,
            }),
          }),
          detail: {
            summary: "Upload question image",
            description: "Upload an image for a question to S3/MinIO (max 5MB, images only)",
          },
        }
      )
      .delete(
        "/:key",
        async ({ params }) => {
          await S3StorageService.deleteImage(params.key);
          return {
            success: true,
            message: "Image deleted successfully",
          };
        },
        {
          params: t.Object({
            key: t.String(),
          }),
          detail: {
            summary: "Delete question image",
            description: "Delete an image from S3/MinIO storage",
          },
        }
      )
  );
