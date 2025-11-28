import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKETS, S3_CONFIG } from "@/lib/s3-client";
import { v4 as uuid } from "uuid";
import { BadRequestError, InternalServerError } from "@/lib/errors";
import { ensureBucketWithPolicy } from "@/lib/s3-bucket-manager";

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
   * Generates a unique filename with the original extension
   */
  private static generateFilename(originalName: string): string {
    const extension = originalName.split(".").pop() || "";
    const uniqueId = uuid();
    return extension ? `${uniqueId}.${extension}` : uniqueId;
  }

  /**
   * Uploads an avatar image to S3/MinIO
   */
  static async uploadAvatar(file: File): Promise<{ url: string; filename: string; key: string }> {
    this.validateImage(file);
    await this.ensureBucket();

    const filename = this.generateFilename(file.name);
    const key = filename; // Don't add prefix since bucket name is already "avatars"

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

      // Generate the public MinIO URL
      // Use PUBLIC_S3_ENDPOINT if available (for external access), otherwise fall back to S3_ENDPOINT
      const publicEndpoint = process.env.PUBLIC_S3_ENDPOINT || S3_CONFIG.ENDPOINT;
      const url = `${publicEndpoint}/${BUCKET_NAME}/${key}`;

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
   * Extracts the S3 key from a full URL
   */
  static extractKeyFromUrl(url: string): string | null {
    try {
      // Support both internal and public endpoints
      const publicEndpoint = process.env.PUBLIC_S3_ENDPOINT || S3_CONFIG.ENDPOINT;

      // Try public endpoint first, then internal
      for (const endpoint of [publicEndpoint, S3_CONFIG.ENDPOINT]) {
        const urlPattern = new RegExp(`${endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${BUCKET_NAME}/(.+)`);
        const match = url.match(urlPattern);
        if (match) return match[1];
      }

      return null;
    } catch {
      return null;
    }
  }
}
