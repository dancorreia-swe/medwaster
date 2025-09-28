import { describe, test, expect, vi, beforeEach } from "vitest";
import { AuditService } from "../modules/audit/audit.service";

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

// Mock database
const mockDb = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue(undefined),
  }),
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
  }),
};

vi.mock("../db", () => ({
  db: mockDb,
}));

vi.mock("../db/schema/audit", () => ({
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

describe("AuditService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  test("should generate proper checksum for tamper detection", async () => {
    await AuditService.log({
      eventType: "user_created",
      userId: "user_456",
    }, {
      ipAddress: "127.0.0.1",
      userAgent: "Test Agent",
    });

    const insertCall = mockDb.insert.mock.calls[0];
    const valuesCall = insertCall[0].values?.mock?.calls?.[0]?.[0];
    
    expect(valuesCall?.checksum).toBe("test-checksum-hash");
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