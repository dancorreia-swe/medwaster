import { Elysia, t } from "elysia";
import { betterAuthMacro, ROLES } from "@/lib/auth";
import { join } from "path";
import { v4 as uuid } from "uuid";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { BadRequestError, InternalServerError } from "@/lib/errors";

// Configuration
const STORAGE_PATH = process.env.QUESTION_IMAGES_PATH || "./uploads/questions";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

class ImageUploadService {
  private static ensureStorageDirectory(): void {
    if (!existsSync(STORAGE_PATH)) {
      mkdirSync(STORAGE_PATH, { recursive: true });
    }
  }

  private static validateImage(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestError(
        `Image size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new BadRequestError(
        `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }
  }

  private static generateFilename(originalName: string): string {
    const extension = originalName.split(".").pop() || "";
    const uniqueId = uuid();
    return extension ? `${uniqueId}.${extension}` : uniqueId;
  }

  static async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    this.validateImage(file);
    this.ensureStorageDirectory();

    const filename = this.generateFilename(file.name);
    const filePath = join(STORAGE_PATH, filename);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      writeFileSync(filePath, buffer);

      return {
        url: `/api/uploads/questions/${filename}`,
        filename,
      };
    } catch (error) {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
      throw new InternalServerError("Image upload failed");
    }
  }

  static deleteImage(filename: string): void {
    const filePath = join(STORAGE_PATH, filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}

export const questionImages = new Elysia({ prefix: "/admin/questions/images" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }, (app) =>
    app.post(
      "/upload",
      async ({ body }) => {
        const result = await ImageUploadService.uploadImage(body.image);
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
          description: "Upload an image for a question (max 5MB, images only)",
        },
      }
    )
  );
