import { t } from "elysia";

// ============================================================================
// Request Bodies
// ============================================================================

export const updateProfileBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  image: t.Optional(t.Nullable(t.String())),
});

export const requestEmailChangeBody = t.Object({
  newEmail: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const verifyEmailChangeBody = t.Object({
  token: t.String({ minLength: 1 }),
});

export const changePasswordBody = t.Object({
  currentPassword: t.String({ minLength: 1 }),
  newPassword: t.String({ minLength: 8 }),
});

export const deleteAccountBody = t.Object({
  password: t.String({ minLength: 1 }),
  confirmation: t.String({ minLength: 1 }),
});

// ============================================================================
// Response Types
// ============================================================================

export const accountStatsResponse = t.Object({
  accountCreatedAt: t.Date(),
  firstLoginAt: t.Union([t.Date(), t.Null()]),
  lastActivityAt: t.Union([t.Date(), t.Null()]),
  emailVerified: t.Boolean(),
  hasPassword: t.Boolean(),
  connectedAccounts: t.Array(
    t.Object({
      provider: t.String(),
      accountId: t.String(),
      connectedAt: t.Date(),
    })
  ),
});

// ============================================================================
// Type Exports
// ============================================================================

export type UpdateProfileBody = typeof updateProfileBody.static;
export type RequestEmailChangeBody = typeof requestEmailChangeBody.static;
export type VerifyEmailChangeBody = typeof verifyEmailChangeBody.static;
export type ChangePasswordBody = typeof changePasswordBody.static;
export type DeleteAccountBody = typeof deleteAccountBody.static;
