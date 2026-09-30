import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// Declared through vi.hoisted: vi.mock factories are lifted above top-level
// bindings, so a plain `const mockDb` would be in its TDZ when they run.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    delete: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

// Paths resolve relative to *this* file, not to the module under test. These
// previously read "../db", which pointed at src/test/db and silently matched
// nothing, so the real database module loaded and dragged the whole schema
// graph in behind it.
vi.mock("@/db", () => ({ db: mockDb }));

vi.mock("@/db/schema/audit", () => ({
  rateLimitMonitor: {
    id: "id",
    identifier: "identifier",
    endpoint: "endpoint",
    attemptCount: "attemptCount",
    windowStart: "windowStart",
    lastAttempt: "lastAttempt",
    alertThreshold: "alertThreshold",
  },
}));

vi.mock("ulid", () => ({
  ulid: () => "rate-limit-ulid-123",
}));

// Mock drizzle operators
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  lt: vi.fn(),
}));

import { RateLimitMonitor } from "../../lib/rate-limit-monitor";

/** Rebuilds the chainable query-builder stubs; returns the `limit` leaf. */
function resetDbChains() {
  const limit = vi.fn().mockResolvedValue([]);
  mockDb.delete.mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  });
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ limit }),
    }),
  });
  mockDb.update.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
  mockDb.insert.mockReturnValue({
    values: vi.fn().mockResolvedValue(undefined),
  });
  return limit;
}

describe("RateLimitMonitor", () => {
  // The `limit` leaf of the select chain; each test decides what the query
  // returns. Rebuilt every test because clearAllMocks() drops return values.
  let limit: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    limit = resetDbChains();
  });

  test("should track new password reset request", async () => {
    limit.mockResolvedValue([]);

    await RateLimitMonitor.trackRequest("user@example.com", "password-reset");

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.delete).toHaveBeenCalled(); // Cleanup old entries
  });

  test("should update existing rate limit record", async () => {
    limit.mockResolvedValue([
      {
        id: "existing-id",
        attemptCount: 2,
        windowStart: new Date(),
        lastAttempt: new Date(),
      },
    ]);

    await RateLimitMonitor.trackRequest("user@example.com", "password-reset");

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  test("should detect excessive attempts", async () => {
    limit.mockResolvedValue([{ id: "high-attempts", attemptCount: 10 }]);

    const isExcessive = await RateLimitMonitor.checkExcessiveAttempts(
      "user@example.com",
      "password-reset",
    );

    expect(isExcessive).toBe(true);
  });

  test("should not detect excessive attempts for low counts", async () => {
    limit.mockResolvedValue([{ id: "low-attempts", attemptCount: 2 }]);

    const isExcessive = await RateLimitMonitor.checkExcessiveAttempts(
      "user@example.com",
      "password-reset",
    );

    expect(isExcessive).toBe(false);
  });

  test("should treat an absent record as not excessive", async () => {
    limit.mockResolvedValue([]);

    const isExcessive = await RateLimitMonitor.checkExcessiveAttempts(
      "new@example.com",
      "password-reset",
    );

    expect(isExcessive).toBe(false);
  });

  test("should get attempt count for user", async () => {
    limit.mockResolvedValue([{ id: "test-id", attemptCount: 3 }]);

    const count = await RateLimitMonitor.getAttemptCount(
      "user@example.com",
      "password-reset",
    );

    expect(count).toBe(3);
  });

  test("should return 0 for non-existing user", async () => {
    limit.mockResolvedValue([]);

    const count = await RateLimitMonitor.getAttemptCount(
      "new@example.com",
      "password-reset",
    );

    expect(count).toBe(0);
  });

  test("should reset rate limit", async () => {
    await RateLimitMonitor.resetLimit("user@example.com", "password-reset");

    expect(mockDb.delete).toHaveBeenCalled();
  });

  test("should handle database errors gracefully", async () => {
    limit.mockRejectedValue(new Error("Database error"));

    // Rate-limit monitoring is supplementary; it must never break the request
    // it is observing.
    await expect(
      RateLimitMonitor.trackRequest("user@example.com", "password-reset"),
    ).resolves.not.toThrow();

    const isExcessive = await RateLimitMonitor.checkExcessiveAttempts(
      "user@example.com",
      "password-reset",
    );
    expect(isExcessive).toBe(false); // Fail open for monitoring
  });

  test("should generate alert for excessive attempts", async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await RateLimitMonitor.generateAlert("user@example.com", "password-reset", 15);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("RATE LIMIT ALERT: user@example.com has made 15 attempts")
    );

    consoleSpy.mockRestore();
  });
});
