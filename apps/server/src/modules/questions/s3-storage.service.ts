import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKETS, S3_CONFIG } from "@/lib/s3-client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { BadRequestError, InternalServerError } from "@/lib/errors";
import { ensureBucketWithPolicy } from "@/lib/s3-bucket-manager";

// Configuration
const BUCKET_NAME = S3_BUCKETS.QUESTIONS;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

export class S3StorageService {
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
   * Uploads an image to S3/MinIO
   */
  static async uploadImage(file: File): Promise<{ url: string; filename: string; key: string }> {
    this.validateImage(file);
    await this.ensureBucket();

    const filename = this.generateFilename(file.name);
    const key = `images/${filename}`;

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
      const url = `${S3_CONFIG.ENDPOINT}/${BUCKET_NAME}/${key}`;

      return {
        url,
        filename,
        key,
      };
    } catch (error) {
      console.error("S3 upload failed:", error);
      throw new InternalServerError("Image upload failed");
    }
  }

  /**
   * Deletes an image from S3/MinIO
   */
  static async deleteImage(key: string): Promise<void> {
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
   * Generates a presigned URL for temporary access
   */
  static async getPresignedUrl(key: string, expiresIn: number = PRESIGNED_URL_EXPIRY): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error("Failed to generate presigned URL:", error);
      throw new InternalServerError("Failed to generate download URL");
    }
  }

  /**
   * Extracts the S3 key from a full URL
   */
  static extractKeyFromUrl(url: string): string | null {
    try {
      const urlPattern = new RegExp(`${S3_CONFIG.ENDPOINT}/${BUCKET_NAME}/(.+)`);
      const match = url.match(urlPattern);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}
