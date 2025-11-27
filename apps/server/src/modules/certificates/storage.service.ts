import { s3Client, S3_BUCKETS, S3_CONFIG } from "@/lib/s3-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ensureBucketWithPolicy } from "@/lib/s3-bucket-manager";

const BUCKET_NAME = S3_BUCKETS.CERTIFICATES;

class CertificateStorageService {
  private static bucketEnsured = false;

  private static async ensureBucket() {
    if (this.bucketEnsured) return;
    await ensureBucketWithPolicy({
      bucketName: BUCKET_NAME,
      policyType: "public-read",
    });
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
