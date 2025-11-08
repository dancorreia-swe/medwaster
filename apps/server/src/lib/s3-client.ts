import { S3Client } from "@aws-sdk/client-s3";

// S3/MinIO Configuration
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
const S3_REGION = process.env.S3_REGION || "us-east-1";

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, 
});

export const S3_BUCKETS = {
  QUESTIONS: process.env.S3_BUCKET_QUESTIONS || "questions",
  WIKI: process.env.S3_BUCKET_WIKI || "wiki",
  AVATARS: process.env.S3_BUCKET_AVATARS || "avatars",
} as const;

export const S3_CONFIG = {
  ENDPOINT: S3_ENDPOINT,
  REGION: S3_REGION,
} as const;
