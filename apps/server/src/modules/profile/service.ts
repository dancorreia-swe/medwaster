import { db } from "@/db";
import { user, account, verification, session } from "@/db/schema/auth";
import { eq, and, ne, desc } from "drizzle-orm";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@/lib/errors";
import type {
  UpdateProfileBody,
  RequestEmailChangeBody,
  ChangePasswordBody,
  DeleteAccountBody,
} from "./model";
import { v4 as uuid } from "uuid";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { EmailService } from "@/lib/email-service";
import { RateLimitMonitor } from "@/lib/rate-limit-monitor";
import { AvatarStorageService } from "./s3-storage.service";

/**
 * Postgres unique-violation (SQLSTATE 23505), as surfaced by the pg driver.
 *
 * Narrowed at runtime rather than asserted: the value reaching a `catch` is
 * `unknown`, and a driver error is not guaranteed to carry `code` at all.
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

/**
 * Verify a credential password, mapping every failure to 401.
 *
 * Better Auth stores scrypt hashes as `salt:key`; its `verifyPassword` *throws*
 * `BetterAuthError("Invalid password hash")` on anything else rather than
 * returning false. A malformed stored hash is a bad credential, not a server
 * fault, so it must not escape as a 500.
 */
async function assertPasswordMatches(
  password: string,
  hash: string,
  message: string
): Promise<void> {
  let matches = false;

  try {
    matches = await verifyPassword({ password, hash });
  } catch {
    throw new UnauthorizedError(message);
  }

  if (!matches) {
    throw new UnauthorizedError(message);
  }
}

/**
 * Drop every session for a user except the one making the request.
 *
 * Changing a login credential (password or email address) must not leave old
 * sessions authenticated. Mirrors Better Auth's `revokeOtherSessions`.
 */
async function revokeOtherSessions(
  userId: string,
  currentSessionId?: string
): Promise<void> {
  await db
    .delete(session)
    .where(
      currentSessionId
        ? and(eq(session.userId, userId), ne(session.id, currentSessionId))
        : eq(session.userId, userId)
    );
}

export abstract class ProfileService {
  /**
   * Update user profile (name and/or image)
   */
  static async updateProfile(userId: string, updates: UpdateProfileBody) {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    const updateData: Partial<UpdateProfileBody> = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    if (updates.image !== undefined) {
      // If user has an existing image and we're changing it, clean up the old one
      if (existingUser.image && updates.image !== existingUser.image) {
        const oldKey = AvatarStorageService.extractKeyFromUrl(existingUser.image);
        if (oldKey) {
          await AvatarStorageService.deleteAvatar(oldKey);
        }
      }
      updateData.image = updates.image;
    }

    const [updatedUser] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId))
      .returning();

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image ?? null,
      emailVerified: Boolean(updatedUser.emailVerified),
    };
  }

  /**
   * Request email change - sends verification email to new address
   */
  static async requestEmailChange(
    userId: string,
    data: RequestEmailChangeBody
  ): Promise<{ success: boolean }> {
    // Get user
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // Check if user has password account (for password verification)
    const passwordAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, userId),
        eq(account.providerId, "credential")
      ),
    });

    if (!passwordAccount || !passwordAccount.password) {
      throw new BadRequestError(
        "Password verification not available. Account created with social login."
      );
    }

    await assertPasswordMatches(
      data.password,
      passwordAccount.password,
      "Invalid password"
    );

    // Each call sends mail to a caller-supplied address, so this is throttled
    // per user regardless of whether the target address is valid.
    if (await RateLimitMonitor.checkExcessiveAttempts(userId, "email-change")) {
      await RateLimitMonitor.generateAlert(
        userId,
        "email-change",
        await RateLimitMonitor.getAttemptCount(userId, "email-change")
      );
      throw new TooManyRequestsError(
        "Too many email change requests. Try again later."
      );
    }

    await RateLimitMonitor.trackRequest(userId, "email-change");

    // `user.email` is compared byte-exact here and by the unique index, so the
    // address is normalised once, up front, and that value is what we store.
    const newEmail = data.newEmail.trim().toLowerCase();

    if (newEmail === existingUser.email.trim().toLowerCase()) {
      throw new BadRequestError(
        "New email must be different from the current one"
      );
    }

    const emailExists = await db.query.user.findFirst({
      where: eq(user.email, newEmail),
    });

    if (emailExists) {
      throw new BadRequestError("Email already in use");
    }

    // Generate verification token
    const token = uuid();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const identifier = `email-change:${userId}`;
    const recordId = uuid();

    // Replace any previous request atomically: two live rows for one user would
    // make which code works depend on row order.
    await db.transaction(async (tx) => {
      await tx.delete(verification).where(eq(verification.identifier, identifier));
      await tx.insert(verification).values({
        id: recordId,
        identifier,
        value: JSON.stringify({ newEmail, token }),
        expiresAt,
      });
    });

    const sent = await EmailService.sendEmailChangeVerification({
      to: newEmail,
      userName: existingUser.name,
      token,
    });

    // sendEmailChangeVerification reports failure by return value, never by
    // throwing. Without this check the caller is told a code was sent when the
    // SMTP hop failed, and the row above has already replaced the previous,
    // still-deliverable code.
    if (!sent.success) {
      await db.delete(verification).where(eq(verification.id, recordId));
      console.error("Email change verification send failed:", sent.error);
      throw new ServiceUnavailableError(
        "Could not send the verification email. Try again shortly."
      );
    }

    return { success: true };
  }

  /**
   * Verify and complete email change
   */
  static async verifyEmailChange(
    userId: string,
    token: string,
    currentSessionId?: string
  ): Promise<{ success: boolean }> {
    // Newest row wins. requestEmailChange keeps only one row per user, but
    // ordering makes that an optimisation rather than a correctness
    // requirement: an unordered findFirst would let a stale row shadow the
    // code the user was actually sent.
    const verificationRecord = await db.query.verification.findFirst({
      where: eq(verification.identifier, `email-change:${userId}`),
      orderBy: desc(verification.createdAt),
    });

    if (!verificationRecord) {
      throw new BadRequestError("Invalid or expired verification token");
    }

    // Check expiration
    if (verificationRecord.expiresAt < new Date()) {
      // Clean up expired token
      await db
        .delete(verification)
        .where(eq(verification.id, verificationRecord.id));
      throw new BadRequestError("Verification token has expired");
    }

    // Parse stored data
    let storedData: { newEmail: string; token: string };
    try {
      storedData = JSON.parse(verificationRecord.value);
    } catch {
      throw new BadRequestError("Invalid verification data");
    }

    // Verify token matches
    if (storedData.token !== token) {
      throw new BadRequestError("Invalid verification token");
    }

    // Uniqueness was last checked when the code was issued, up to an hour ago.
    // Re-check, and still guard the write: only the unique index closes the
    // window between this read and the update.
    const emailExists = await db.query.user.findFirst({
      where: eq(user.email, storedData.newEmail),
    });

    if (emailExists && emailExists.id !== userId) {
      await db
        .delete(verification)
        .where(eq(verification.id, verificationRecord.id));
      throw new ConflictError("Email already in use");
    }

    try {
      await db
        .update(user)
        .set({
          email: storedData.newEmail,
          emailVerified: true,
        })
        .where(eq(user.id, userId));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("Email already in use");
      }
      throw error;
    }

    // Clean up verification token
    await db
      .delete(verification)
      .where(eq(verification.id, verificationRecord.id));

    // The login identifier changed; anything already signed in with the old
    // one must re-authenticate.
    await revokeOtherSessions(userId, currentSessionId);

    return { success: true };
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    data: ChangePasswordBody,
    currentSessionId?: string
  ): Promise<{ success: boolean }> {
    // Get user's password account
    const passwordAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, userId),
        eq(account.providerId, "credential")
      ),
    });

    if (!passwordAccount || !passwordAccount.password) {
      throw new BadRequestError(
        "Password change not available. Account created with social login."
      );
    }

    await assertPasswordMatches(
      data.currentPassword,
      passwordAccount.password,
      "Current password is incorrect"
    );

    // Hash new password. Must use Better Auth's hasher: sign-in verifies with
    // it, so any other algorithm locks the account out.
    const hashedPassword = await hashPassword(data.newPassword);

    // Update password
    await db
      .update(account)
      .set({ password: hashedPassword })
      .where(eq(account.id, passwordAccount.id));

    // Matches the web client, which calls Better Auth with
    // `revokeOtherSessions: true`, and the promise both UIs make to the user.
    await revokeOtherSessions(userId, currentSessionId);

    return { success: true };
  }

  /**
   * Delete user account (soft delete)
   */
  static async deleteAccount(
    userId: string,
    data: DeleteAccountBody
  ): Promise<{ success: boolean }> {
    // Verify confirmation text
    if (data.confirmation !== "DELETE MY ACCOUNT") {
      throw new BadRequestError(
        'Please type "DELETE MY ACCOUNT" to confirm deletion'
      );
    }

    // Get user's password account if exists
    const passwordAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, userId),
        eq(account.providerId, "credential")
      ),
    });

    // If user has password account, verify password
    if (passwordAccount && passwordAccount.password) {
      await assertPasswordMatches(
        data.password,
        passwordAccount.password,
        "Invalid password"
      );
    }

    // Get user to clean up avatar
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (existingUser?.image) {
      const avatarKey = AvatarStorageService.extractKeyFromUrl(existingUser.image);
      if (avatarKey) {
        await AvatarStorageService.deleteAvatar(avatarKey);
      }
    }

    // Soft delete by banning permanently
    await db
      .update(user)
      .set({
        banned: true,
        banReason: "Account deleted by user",
        banExpires: null,
      })
      .where(eq(user.id, userId));

    return { success: true };
  }

  /**
   * Get account statistics
   */
  static async getAccountStats(userId: string) {
    // Get user
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userRecord) {
      throw new NotFoundError("User not found");
    }

    // Get connected accounts
    const connectedAccounts = await db.query.account.findMany({
      where: eq(account.userId, userId),
    });

    // Check if user has password
    const hasPassword = connectedAccounts.some(
      (acc) => acc.providerId === "credential" && acc.password
    );

    // Map accounts to response format
    const accountsList = connectedAccounts
      .filter((acc) => acc.providerId !== "credential")
      .map((acc) => ({
        provider: acc.providerId,
        accountId: acc.accountId,
        connectedAt: acc.createdAt,
      }));

    return {
      accountCreatedAt: userRecord.createdAt,
      firstLoginAt: userRecord.firstLoginAt ?? null,
      lastActivityAt: userRecord.updatedAt ?? null,
      emailVerified: Boolean(userRecord.emailVerified),
      hasPassword,
      connectedAccounts: accountsList,
    };
  }
}
