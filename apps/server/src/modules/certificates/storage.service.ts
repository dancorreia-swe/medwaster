import { s3Client, S3_BUCKETS, S3_CONFIG } from "@/lib/s3-client";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = S3_BUCKETS.CERTIFICATES;

class CertificateStorageService {
  private static bucketEnsured = false;

  private static async ensureBucket() {
    if (this.bucketEnsured) return;
    try {
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: BUCKET_NAME,
        }),
      );
    } catch (error) {
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: BUCKET_NAME,
        }),
      );
    }
    this.bucketEnsured = true;
  }

  static async uploadPdf(key: string, buffer: ArrayBuffer | Buffer | Uint8Array) {
    await this.ensureBucket();

    const normalizedBuffer = Buffer.isBuffer(buffer)
      ? buffer
      : buffer instanceof ArrayBuffer
        ? Buffer.from(buffer)
        : Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: normalizedBuffer,
        ContentType: "application/pdf",
        ContentLength: normalizedBuffer.byteLength,
      }),
    );

    return `${S3_CONFIG.ENDPOINT}/${BUCKET_NAME}/${key}`;
  }
}

export { CertificateStorageService };
