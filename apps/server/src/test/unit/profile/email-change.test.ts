import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Covers the server behaviour this feature branch changed:
 *  - a failed SMTP hop must not be reported to the caller as success
 *  - re-requesting a code must leave exactly one usable verification row
 *  - verification must resolve the newest row, not an arbitrary one
 *  - completing an email or password change must revoke other sessions
 *  - a malformed stored password hash is a 401, never a 500
 */

const {
  mockDb,
  mockTx,
  mockEmailService,
  mockRateLimit,
  mockVerifyPassword,
  insertedRows,
  deletes,
  schema,
} = vi.hoisted(() => {
  const tx = { delete: vi.fn(), insert: vi.fn() };

  return {
    mockDb: {
      query: {
        user: { findFirst: vi.fn() },
        account: { findFirst: vi.fn() },
        verification: { findFirst: vi.fn() },
      },
      update: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
    },
    mockTx: tx,
    mockEmailService: { sendEmailChangeVerification: vi.fn() },
    mockRateLimit: {
      checkExcessiveAttempts: vi.fn(),
      trackRequest: vi.fn(),
      generateAlert: vi.fn(),
      getAttemptCount: vi.fn(),
    },
    mockVerifyPassword: vi.fn(),
    insertedRows: [] as Record<string, unknown>[],
    deletes: [] as { table: unknown; filter: unknown }[],
    schema: {
      user: { id: "user.id", email: "user.email" },
      account: {
        id: "account.id",
        userId: "account.userId",
        providerId: "account.providerId",
      },
      verification: {
        id: "verification.id",
        identifier: "verification.identifier",
        createdAt: "verification.createdAt",
      },
      session: { id: "session.id", userId: "session.userId" },
    },
  };
});

vi.mock("@/db", () => ({ db: mockDb }),
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("@/db/schema/auth", () => schema,
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("@/lib/errors", () => {
  // Declared inside the factory: vi.mock is hoisted above top-level bindings,
  // so referencing an outer class here would hit a TDZ error.
  class TestHttpError extends Error {
    constructor(
      message: string,
      public statusCode: number,
      name: string,
    ) {
      super(message);
      this.name = name;
    }
  }

  return {
    BadRequestError: class extends TestHttpError {
      constructor(m = "Bad request") { super(m, 400, "BadRequestError"); }
    },
    ConflictError: class extends TestHttpError {
      constructor(m = "Conflict") { super(m, 409, "ConflictError"); }
    },
    NotFoundError: class extends TestHttpError {
      constructor(m = "Resource") { super(`${m} not found`, 404, "NotFoundError"); }
    },
    ServiceUnavailableError: class extends TestHttpError {
      constructor(m = "Unavailable") { super(m, 503, "ServiceUnavailableError"); }
    },
    TooManyRequestsError: class extends TestHttpError {
      constructor(m = "Rate limited") { super(m, 429, "TooManyRequestsError"); }
    },
    UnauthorizedError: class extends TestHttpError {
      constructor(m = "Unauthorized") { super(m, 401, "UnauthorizedError"); }
    },
  };
},
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("@/lib/email-service", () => ({ EmailService: mockEmailService }),
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("@/lib/rate-limit-monitor", () => ({ RateLimitMonitor: mockRateLimit }),
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  verifyPassword: mockVerifyPassword,
}));
vi.mock("drizzle-orm", () => ({
  and: (...parts: unknown[]) => ({ op: "and", parts }),
  desc: (column: unknown) => ({ op: "desc", column }),
  eq: (column: unknown, value: unknown) => ({ op: "eq", column, value }),
  ne: (column: unknown, value: unknown) => ({ op: "ne", column, value }),
}));
vi.mock("../../../modules/profile/s3-storage.service", () => ({
  AvatarStorageService: {
    extractKeyFromUrl: vi.fn(),
    deleteAvatar: vi.fn(),
  },
}));

import { ProfileService } from "../../../modules/profile/service";

const USER = { id: "user-1", name: "Ana", email: "ana@old.example", image: null };

const VALID_RECORD = {
  id: "ver-1",
  expiresAt: new Date(Date.now() + 60_000),
  value: JSON.stringify({ newEmail: "ana@new.example", token: "tok" }),
};

/** Every session row the service asked to delete, with its filter. */
function sessionDeletes() {
  return deletes.filter((entry) => entry.table === schema.session);
}

beforeEach(() => {
  vi.clearAllMocks();
  insertedRows.length = 0;
  deletes.length = 0;

  mockVerifyPassword.mockResolvedValue(true);
  mockRateLimit.checkExcessiveAttempts.mockResolvedValue(false);
  mockRateLimit.trackRequest.mockResolvedValue(undefined);
  mockRateLimit.generateAlert.mockResolvedValue(undefined);
  mockRateLimit.getAttemptCount.mockResolvedValue(0);
  mockEmailService.sendEmailChangeVerification.mockResolvedValue({
    success: true,
    messageId: "m1",
  });

  // Lookups by id resolve the caller; lookups by email are the "is this
  // address taken?" probe and find nothing unless a test says otherwise.
  mockDb.query.user.findFirst.mockImplementation(
    async (args: { where?: { column?: unknown } }) =>
      args?.where?.column === schema.user.id ? USER : undefined,
  );
  mockDb.query.account.findFirst.mockResolvedValue({
    id: "acct-1",
    password: "salt:key",
  });
  mockDb.query.verification.findFirst.mockResolvedValue(VALID_RECORD);

  mockTx.delete.mockReturnValue({ where: vi.fn(async () => undefined) });
  mockTx.insert.mockReturnValue({
    values: vi.fn(async (row: Record<string, unknown>) => {
      insertedRows.push(row);
    }),
  });

  mockDb.delete.mockImplementation((table: unknown) => ({
    where: vi.fn(async (filter: unknown) => {
      deletes.push({ table, filter });
    }),
  }));
  mockDb.update.mockReturnValue({
    set: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
  });
});

describe("requestEmailChange", () => {
  const body = { newEmail: "ana@new.example", password: "pw" };

  it("replaces prior requests and inserts exactly one row, atomically", async () => {
    await ProfileService.requestEmailChange(USER.id, body);

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.delete).toHaveBeenCalledTimes(1);
    expect(insertedRows).toHaveLength(1);
  });

  it("normalises the new address before storing and sending", async () => {
    await ProfileService.requestEmailChange(USER.id, {
      newEmail: "  Ana@New.Example  ",
      password: "pw",
    });

    const stored = JSON.parse(String(insertedRows[0].value));
    expect(stored.newEmail).toBe("ana@new.example");
    expect(
      mockEmailService.sendEmailChangeVerification.mock.calls[0][0].to,
    ).toBe("ana@new.example");
  });

  // The bug: EmailService signals failure by return value, so the endpoint
  // used to answer `{ success: true }` for a code that was never delivered.
  it("fails loudly when the email cannot be sent", async () => {
    mockEmailService.sendEmailChangeVerification.mockResolvedValue({
      success: false,
      error: "ECONNREFUSED",
    });

    await expect(
      ProfileService.requestEmailChange(USER.id, body),
    ).rejects.toMatchObject({ statusCode: 503 });
  });

  it("does not leave an unusable code behind when the send fails", async () => {
    mockEmailService.sendEmailChangeVerification.mockResolvedValue({
      success: false,
      error: "ECONNREFUSED",
    });

    await ProfileService.requestEmailChange(USER.id, body).catch(
      () => undefined,
    );

    const removed = deletes.filter(
      (entry) => entry.table === schema.verification,
    );
    expect(removed).toHaveLength(1);
  });

  it("rejects an address already used by someone else", async () => {
    mockDb.query.user.findFirst.mockImplementation(
      async (args: { where?: { column?: unknown } }) =>
        args?.where?.column === schema.user.id
          ? USER
          : { id: "other", email: "ana@new.example" },
    );

    await expect(
      ProfileService.requestEmailChange(USER.id, body),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects reusing the current address regardless of casing", async () => {
    await expect(
      ProfileService.requestEmailChange(USER.id, {
        newEmail: "ANA@OLD.EXAMPLE",
        password: "pw",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throttles repeated requests before sending anything", async () => {
    mockRateLimit.checkExcessiveAttempts.mockResolvedValue(true);

    await expect(
      ProfileService.requestEmailChange(USER.id, body),
    ).rejects.toMatchObject({ statusCode: 429 });

    expect(mockEmailService.sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  it("maps a malformed stored hash to 401 rather than a 500", async () => {
    mockVerifyPassword.mockRejectedValue(new Error("Invalid password hash"));

    await expect(
      ProfileService.requestEmailChange(USER.id, body),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects a wrong password without sending mail", async () => {
    mockVerifyPassword.mockResolvedValue(false);

    await expect(
      ProfileService.requestEmailChange(USER.id, body),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(mockEmailService.sendEmailChangeVerification).not.toHaveBeenCalled();
  });
});

describe("verifyEmailChange", () => {
  it("resolves the newest verification row", async () => {
    mockDb.query.user.findFirst.mockResolvedValue(undefined);

    await ProfileService.verifyEmailChange(USER.id, "tok", "sess-1");

    const args = mockDb.query.verification.findFirst.mock.calls[0][0];
    expect(args.orderBy).toEqual({
      op: "desc",
      column: schema.verification.createdAt,
    });
  });

  it("rejects a token that does not match the stored one", async () => {
    await expect(
      ProfileService.verifyEmailChange(USER.id, "wrong", "sess-1"),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("rejects an expired code", async () => {
    mockDb.query.verification.findFirst.mockResolvedValue({
      ...VALID_RECORD,
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(
      ProfileService.verifyEmailChange(USER.id, "tok", "sess-1"),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  // Uniqueness was last checked when the code was issued, up to an hour ago.
  it("re-checks uniqueness at redemption time", async () => {
    mockDb.query.user.findFirst.mockResolvedValue({
      id: "someone-else",
      email: "ana@new.example",
    });

    await expect(
      ProfileService.verifyEmailChange(USER.id, "tok", "sess-1"),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("revokes other sessions but keeps the caller signed in", async () => {
    mockDb.query.user.findFirst.mockResolvedValue(undefined);

    await ProfileService.verifyEmailChange(USER.id, "tok", "sess-1");

    const [revoke] = sessionDeletes();
    expect(revoke).toBeDefined();
    expect(revoke.filter).toEqual({
      op: "and",
      parts: [
        { op: "eq", column: schema.session.userId, value: USER.id },
        { op: "ne", column: schema.session.id, value: "sess-1" },
      ],
    });
  });

  it("revokes every session when the caller's session is unknown", async () => {
    mockDb.query.user.findFirst.mockResolvedValue(undefined);

    await ProfileService.verifyEmailChange(USER.id, "tok");

    const [revoke] = sessionDeletes();
    expect(revoke.filter).toEqual({
      op: "eq",
      column: schema.session.userId,
      value: USER.id,
    });
  });
});

describe("changePassword", () => {
  const body = { currentPassword: "old", newPassword: "NewPassw0rd" };

  it("stores a Better Auth hash and revokes other sessions", async () => {
    await ProfileService.changePassword(USER.id, body, "sess-1");

    const written = mockDb.update.mock.results[0].value.set.mock.calls[0][0];
    expect(written.password).toBe("hashed:NewPassw0rd");

    const [revoke] = sessionDeletes();
    expect(revoke).toBeDefined();
    expect(revoke.filter).toEqual({
      op: "and",
      parts: [
        { op: "eq", column: schema.session.userId, value: USER.id },
        { op: "ne", column: schema.session.id, value: "sess-1" },
      ],
    });
  });

  it("maps a malformed stored hash to 401 rather than a 500", async () => {
    mockVerifyPassword.mockRejectedValue(new Error("Invalid password hash"));

    await expect(
      ProfileService.changePassword(USER.id, body, "sess-1"),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("rejects a wrong current password", async () => {
    mockVerifyPassword.mockResolvedValue(false);

    await expect(
      ProfileService.changePassword(USER.id, body, "sess-1"),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
