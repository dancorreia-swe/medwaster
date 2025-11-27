import {
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
import { InternalServerError } from "@/lib/errors";

export type BucketPolicyType = "public-read" | "private";

export interface BucketConfig {
  bucketName: string;
  policyType?: BucketPolicyType;
  allowedMethods?: string[];
  allowedOrigins?: string[];
}

/**
 * Creates a bucket with the specified policy configuration
 * Default policy: public read access, private write access
 */
export async function ensureBucketWithPolicy(config: BucketConfig): Promise<void> {
  const {
    bucketName,
    policyType = "public-read",
    allowedMethods = ["GET", "HEAD"],
    allowedOrigins = ["*"],
  } = config;

  let bucketExists = false;

  // Check if bucket exists
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    bucketExists = true;
  } catch (error) {
    // Bucket doesn't exist, create it
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`Created S3 bucket: ${bucketName}`);
      bucketExists = true;
    } catch (createError) {
      console.error(`Failed to create bucket ${bucketName}:`, createError);
      throw new InternalServerError("Storage bucket initialization failed");
    }
  }

  // Always ensure bucket policy and CORS are set (whether new or existing)
  if (bucketExists) {
    try {
      // Apply bucket policy based on type
      if (policyType === "public-read") {
        const bucketPolicy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };

        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(bucketPolicy),
          })
        );
      }
      // For "private" policy, we don't set any public access policy

      // Set CORS configuration to allow browser access
      const corsConfiguration = {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: allowedMethods,
            AllowedOrigins: allowedOrigins,
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      };

      await s3Client.send(
        new PutBucketCorsCommand({
          Bucket: bucketName,
          CORSConfiguration: corsConfiguration,
        })
      );
    } catch (policyError) {
      console.warn(`Failed to set bucket policies for ${bucketName}:`, policyError);
      // Don't throw - bucket exists and may work without these policies
    }
  }
}
