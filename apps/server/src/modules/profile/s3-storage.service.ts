import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKETS, S3_CONFIG } from "@/lib/s3-client";
import { v4 as uuid } from "uuid";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "@/lib/errors";
import { ensureBucketWithPolicy } from "@/lib/s3-bucket-manager";
import {
  avatarKeyFor,
  buildAvatarUrl,
  extractAvatarKey,
  isValidAvatarKey,
} from "./avatar-url";

// Configuration
const BUCKET_NAME = S3_BUCKETS.AVATARS;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export class AvatarStorageService {
  /**
   * Ensures the bucket exists with public read, private write policy
   */
  private static async ensureBucket(): Promise<void> {
    await ensureBucketWithPolicy({
      bucketName: BUCKET_NAME,
      policyType: "public-read",
    });
  }

  /**
   * Validates the uploaded file
   */
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

  /**
   * Uploads an avatar image to S3/MinIO.
   *
   * `publicOrigin` is the API origin the client reached; the returned URL is
   * served by `GET /api/profile/avatar/:key`, so it never depends on MinIO
   * being reachable from the client.
   */
  static async uploadAvatar(
    file: File,
    publicOrigin: string
  ): Promise<{ url: string; filename: string; key: string }> {
    this.validateImage(file);
    await this.ensureBucket();

    // Bucket name is already "avatars", so the key carries no prefix
    const key = avatarKeyFor(uuid(), file.type);
    const filename = key;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ContentLength: file.size,
      });

      await s3Client.send(command);

      const url = buildAvatarUrl(publicOrigin, key);

      return {
        url,
        filename,
        key,
      };
    } catch (error) {
      console.error("S3 avatar upload failed:", error);
      throw new InternalServerError("Avatar upload failed");
    }
  }

  /**
   * Reads an avatar object for the public avatar route.
   */
  static async getAvatar(
    key: string
  ): Promise<{ body: ReadableStream; contentType: string; contentLength?: number }> {
    if (!isValidAvatarKey(key)) {
      throw new NotFoundError("Avatar");
    }

    try {
      const object = await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
      );

      if (!object.Body) {
        throw new NotFoundError("Avatar");
      }

      return {
        body: object.Body.transformToWebStream(),
        contentType: object.ContentType || "application/octet-stream",
        contentLength: object.ContentLength,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof NoSuchKey) {
        throw new NotFoundError("Avatar");
      }
      console.error("S3 avatar read failed:", error);
      throw new InternalServerError("Avatar unavailable");
    }
  }

  /**
   * Deletes an avatar from S3/MinIO
   */
  static async deleteAvatar(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error("S3 delete failed:", error);
      // Don't throw error on delete failure - it's not critical
    }
  }

  /**
   * Extracts the S3 key from a stored avatar URL (API or legacy MinIO form)
   */
  static extractKeyFromUrl(url: string): string | null {
    return extractAvatarKey(url, {
      bucket: BUCKET_NAME,
      legacyEndpoints: [
        process.env.PUBLIC_S3_ENDPOINT ?? "",
        S3_CONFIG.ENDPOINT,
      ],
    });
  }
}
