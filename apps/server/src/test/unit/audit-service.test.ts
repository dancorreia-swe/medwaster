import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// Mock ulid
vi.mock("ulid", () => ({
  ulid: () => "test-ulid-123",
}));

// Mock crypto
vi.mock("crypto", () => ({
  createHmac: () => ({
    update: () => ({
      digest: () => "test-checksum-hash",
    }),
  }),
}));

// Declared through vi.hoisted: vi.mock factories are lifted above top-level
// bindings, so a plain `const mockDb` would be in its TDZ when they run.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}));

// Paths resolve relative to *this* file, not to the module under test. This
// previously read "../db", which pointed at src/test/db and matched nothing,
// so every test here ran against a real Postgres connection.
vi.mock("@/db", () => ({ db: mockDb }));

vi.mock("@/db/schema/audit", () => ({
  auditLog: {
    id: "id",
    eventType: "eventType",
    userId: "userId",
    sessionId: "sessionId",
    timestamp: "timestamp",
    ipAddress: "ipAddress",
    userAgent: "userAgent",
    resourceType: "resourceType",
    resourceId: "resourceId",
    oldValues: "oldValues",
    newValues: "newValues",
    additionalContext: "additionalContext",
    checksum: "checksum",
  },
}));

import { AuditService } from "../../modules/audit/audit.service";

/** Rebuilds the insert chain; returns the `values` leaf for assertions. */
function resetDbChains() {
  const values = vi.fn().mockResolvedValue(undefined);
  mockDb.insert.mockReturnValue({ values });
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
  });
  return values;
}

describe("AuditService", () => {
  // The `values` leaf of the insert chain. Rebuilt every test because
  // clearAllMocks() drops return values.
  let insertedValues: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    insertedValues = resetDbChains();
    process.env.AUDIT_CHECKSUM_SECRET = "test-secret";
  });

  test("should log audit event successfully", async () => {
    const logId = await AuditService.log({
      eventType: "login_success",
      userId: "user_123",
      additionalContext: {
        method: "email",
      },
    }, {
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0...",
    });

    expect(logId).toBe("test-ulid-123");
    expect(mockDb.insert).toHaveBeenCalled();
    expect(insertedValues).toHaveBeenCalledTimes(1);
  });

  test("should generate proper checksum for tamper detection", async () => {
    await AuditService.log({
      eventType: "user_created",
      userId: "user_456",
    }, {
      ipAddress: "127.0.0.1",
      userAgent: "Test Agent",
    });

    // Previously read `insertCall[0].values`, i.e. a property of the schema
    // object passed to insert(), which is always undefined.
    const written = insertedValues.mock.calls[0][0];

    expect(written.checksum).toBe("test-checksum-hash");
    expect(written.eventType).toBe("user_created");
    expect(written.userId).toBe("user_456");
  });

  test("should extract client IP from request headers", () => {
    const mockRequest = {
      headers: {
        get: vi.fn()
          .mockReturnValueOnce("203.0.113.1, 192.168.1.1") // x-forwarded-for
          .mockReturnValueOnce(null) // x-real-ip
      }
    } as any;

    mockRequest.headers.get.mockReturnValueOnce("203.0.113.1, 192.168.1.1");
    
    const ip = AuditService.getClientIP(mockRequest);
    expect(ip).toBe("203.0.113.1");
  });

  test("should fallback to localhost for development", () => {
    const mockRequest = {
      headers: {
        get: vi.fn().mockReturnValue(null)
      }
    } as any;
    
    const ip = AuditService.getClientIP(mockRequest);
    expect(ip).toBe("127.0.0.1");
  });
});
