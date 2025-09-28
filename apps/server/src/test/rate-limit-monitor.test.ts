import { describe, test, expect, vi, beforeEach } from "vitest";
import { RateLimitMonitor } from "../lib/rate-limit-monitor";

// Mock database
const mockDb = {
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  }),
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn(),
      }),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  }),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue(undefined),
  }),
};

vi.mock("../db", () => ({
  db: mockDb,
}));

vi.mock("../db/schema/audit", () => ({
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

describe("RateLimitMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should track new password reset request", async () => {
    // Mock no existing records
    mockDb.select().from().where().limit.mockResolvedValue([]);

    await RateLimitMonitor.trackRequest("user@example.com", "password-reset");

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.delete).toHaveBeenCalled(); // Cleanup old entries
  });

  test("should update existing rate limit record", async () => {
    // Mock existing record
    const existingRecord = {
      id: "existing-id",
      attemptCount: 2,
      windowStart: new Date(),
      lastAttempt: new Date(),
    };
    
    mockDb.select().from().where().limit.mockResolvedValue([existingRecord]);

    await RateLimitMonitor.trackRequest("user@example.com", "password-reset");

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  test("should detect excessive attempts", async () => {
    // Mock record with high attempt count
    const highAttemptRecord = {
      id: "high-attempts",
      attemptCount: 10,
      windowStart: new Date(),
      lastAttempt: new Date(),
    };
    
    mockDb.select().from().where().limit.mockResolvedValue([highAttemptRecord]);

    const isExcessive = await RateLimitMonitor.checkExcessiveAttempts("user@example.com", "password-reset");
    
    expect(isExcessive).toBe(true);
  });

  test("should not detect excessive attempts for low counts", async () => {
    // Mock record with low attempt count
    const lowAttemptRecord = {
      id: "low-attempts",
      attemptCount: 2,
      windowStart: new Date(),
      lastAttempt: new Date(),
    };
    
    mockDb.select().from().where().limit.mockResolvedValue([lowAttemptRecord]);

    const isExcessive = await RateLimitMonitor.checkExcessiveAttempts("user@example.com", "password-reset");
    
    expect(isExcessive).toBe(false);
  });

  test("should get attempt count for user", async () => {
    const record = {
      id: "test-id",
      attemptCount: 3,
    };
    
    mockDb.select().from().where().limit.mockResolvedValue([record]);

    const count = await RateLimitMonitor.getAttemptCount("user@example.com", "password-reset");
    
    expect(count).toBe(3);
  });

  test("should return 0 for non-existing user", async () => {
    mockDb.select().from().where().limit.mockResolvedValue([]);

    const count = await RateLimitMonitor.getAttemptCount("new@example.com", "password-reset");
    
    expect(count).toBe(0);
  });

  test("should reset rate limit", async () => {
    await RateLimitMonitor.resetLimit("user@example.com", "password-reset");

    expect(mockDb.delete).toHaveBeenCalled();
  });

  test("should handle database errors gracefully", async () => {
    // Mock database error
    mockDb.select().from().where().limit.mockRejectedValue(new Error("Database error"));

    // Should not throw error
    await expect(RateLimitMonitor.trackRequest("user@example.com", "password-reset")).resolves.not.toThrow();
    
    const isExcessive = await RateLimitMonitor.checkExcessiveAttempts("user@example.com", "password-reset");
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