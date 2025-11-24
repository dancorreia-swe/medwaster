import { db } from "@/db";
import { user, account, verification } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import type {
  UpdateProfileBody,
  RequestEmailChangeBody,
  ChangePasswordBody,
  DeleteAccountBody,
} from "./model";
import { v4 as uuid } from "uuid";
import { EmailService } from "@/lib/email-service";
import { AvatarStorageService } from "./s3-storage.service";

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

    // Verify current password using Bun's built-in password verification
    const passwordMatches = await Bun.password.verify(
      data.password,
      passwordAccount.password
    );

    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid password");
    }

    // Check if new email is already in use
    const emailExists = await db.query.user.findFirst({
      where: eq(user.email, data.newEmail),
    });

    if (emailExists) {
      throw new BadRequestError("Email already in use");
    }

    // Generate verification token
    const token = uuid();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store verification token
    await db.insert(verification).values({
      id: uuid(),
      identifier: `email-change:${userId}`,
      value: JSON.stringify({
        newEmail: data.newEmail,
        token,
      }),
      expiresAt,
    });

    // Send verification email
    await EmailService.sendEmailChangeVerification({
      to: data.newEmail,
      userName: existingUser.name,
      token,
    });

    return { success: true };
  }

  /**
   * Verify and complete email change
   */
  static async verifyEmailChange(
    userId: string,
    token: string
  ): Promise<{ success: boolean }> {
    // Find verification record
    const verificationRecord = await db.query.verification.findFirst({
      where: eq(verification.identifier, `email-change:${userId}`),
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

    // Update user email
    await db
      .update(user)
      .set({
        email: storedData.newEmail,
        emailVerified: true,
      })
      .where(eq(user.id, userId));

    // Clean up verification token
    await db
      .delete(verification)
      .where(eq(verification.id, verificationRecord.id));

    return { success: true };
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    data: ChangePasswordBody
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

    // Verify current password
    const passwordMatches = await Bun.password.verify(
      data.currentPassword,
      passwordAccount.password
    );

    if (!passwordMatches) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await Bun.password.hash(data.newPassword);

    // Update password
    await db
      .update(account)
      .set({ password: hashedPassword })
      .where(eq(account.id, passwordAccount.id));

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
      const passwordMatches = await Bun.password.verify(
        data.password,
        passwordAccount.password
      );

      if (!passwordMatches) {
        throw new UnauthorizedError("Invalid password");
      }
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
