import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  GetObjectCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKETS, S3_CONFIG } from "@/lib/s3-client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { BadRequestError, InternalServerError } from "@/lib/errors";

// Configuration
const BUCKET_NAME = S3_BUCKETS.ACHIEVEMENTS;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

export class AchievementS3StorageService {
  /**
   * Ensures the bucket exists and has proper policies, creates it if it doesn't
   */
  private static async ensureBucket(): Promise<void> {
    let bucketExists = false;

    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
      bucketExists = true;
    } catch (error) {
      // Bucket doesn't exist, create it
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`Created S3 bucket: ${BUCKET_NAME}`);
        bucketExists = true;
      } catch (createError) {
        console.error(`Failed to create bucket ${BUCKET_NAME}:`, createError);
        throw new InternalServerError("Storage bucket initialization failed");
      }
    }

    // Always ensure bucket policy and CORS are set (whether new or existing)
    if (bucketExists) {
      try {
        // Set bucket policy to allow public read access
        const bucketPolicy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
            },
          ],
        };

        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: BUCKET_NAME,
            Policy: JSON.stringify(bucketPolicy),
          })
        );

        // Set CORS configuration to allow browser access
        const corsConfiguration = {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "HEAD"],
              AllowedOrigins: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3000,
            },
          ],
        };

        await s3Client.send(
          new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: corsConfiguration,
          })
        );
      } catch (policyError) {
        console.warn(`Failed to set bucket policies for ${BUCKET_NAME}:`, policyError);
        // Don't throw - bucket exists and may work without these policies
      }
    }
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
    const key = `badges/${filename}`;

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
