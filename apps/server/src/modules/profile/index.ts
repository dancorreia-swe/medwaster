import Elysia, { t } from "elysia";
import { betterAuthMacro } from "@/lib/auth";
import { success, successResponseSchema } from "@/lib/responses";
import { AvatarStorageService } from "./s3-storage.service";
import { ProfileService } from "./service";
import {
  updateProfileBody,
  requestEmailChangeBody,
  verifyEmailChangeBody,
  changePasswordBody,
  deleteAccountBody,
  accountStatsResponse,
} from "./model";

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const profileModule = new Elysia({
  prefix: "/profile",
  tags: ["Profile"],
  detail: {
    description: "User profile management endpoints",
  },
})
  .use(betterAuthMacro)
  .guard(
    {
      auth: true,
      detail: {
        description: "Authentication required",
      },
    },
    (app) =>
      app
        // Upload profile picture
        .post(
          "/avatar/upload",
          async ({ body, status }) => {
            const result = await AvatarStorageService.uploadAvatar(body.image);
            return status(200, success(result));
          },
          {
            body: t.Object({
              image: t.File({
                type: ALLOWED_MIME_TYPES,
                maxSize: MAX_FILE_SIZE,
              }),
            }),
            detail: {
              summary: "Upload profile picture",
              description:
                "Upload a new profile picture to S3/MinIO (max 5MB, images only)",
              tags: ["Profile"],
            },
          }
        )
        // Update profile (name, image)
        .patch(
          "/",
          async ({ user, body, status }) => {
            const result = await ProfileService.updateProfile(user!.id, body);
            return status(200, success(result));
          },
          {
            body: updateProfileBody,
            detail: {
              summary: "Update profile",
              description:
                "Update user profile information (name and/or profile picture URL)",
              tags: ["Profile"],
            },
          }
        )
        // Request email change
        .post(
          "/email/request-change",
          async ({ user, body, status }) => {
            const result = await ProfileService.requestEmailChange(
              user!.id,
              body
            );
            return status(200, success(result));
          },
          {
            body: requestEmailChangeBody,
            detail: {
              summary: "Request email change",
              description:
                "Request to change account email. Sends verification code to new email address.",
              tags: ["Profile"],
            },
          }
        )
        // Verify email change
        .post(
          "/email/verify-change",
          async ({ user, body, status }) => {
            const result = await ProfileService.verifyEmailChange(
              user!.id,
              body.token
            );
            return status(200, success(result));
          },
          {
            body: verifyEmailChangeBody,
            detail: {
              summary: "Verify email change",
              description:
                "Verify and complete email change using the verification code",
              tags: ["Profile"],
            },
          }
        )
        // Change password
        .post(
          "/password/change",
          async ({ user, body, status }) => {
            const result = await ProfileService.changePassword(user!.id, body);
            return status(200, success(result));
          },
          {
            body: changePasswordBody,
            detail: {
              summary: "Change password",
              description: "Change account password (requires current password)",
              tags: ["Profile"],
            },
          }
        )
        // Get account stats
        .get(
          "/stats/account",
          async ({ user, status }) => {
            const result = await ProfileService.getAccountStats(user!.id);
            return status(200, success(result));
          },
          {
            response: successResponseSchema(accountStatsResponse),
            detail: {
              summary: "Get account statistics",
              description:
                "Get account metadata including creation date, connected accounts, etc.",
              tags: ["Profile"],
            },
          }
        )
        // Delete account
        .delete(
          "/",
          async ({ user, body, status }) => {
            const result = await ProfileService.deleteAccount(user!.id, body);
            return status(200, success(result));
          },
          {
            body: deleteAccountBody,
            detail: {
              summary: "Delete account",
              description:
                "Permanently delete user account (soft delete via ban). Requires password and confirmation.",
              tags: ["Profile"],
            },
          }
        )
  );
