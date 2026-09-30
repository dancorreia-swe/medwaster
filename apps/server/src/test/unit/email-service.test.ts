import { describe, test, expect, vi, beforeEach } from "vitest";

// EmailService caches its transporter after the first initialize(), so the
// per-test hook has to be a stable `sendMail` reference rather than a fresh
// createTransport return value. The previous version reassigned
// createTransport through a CommonJS `require`, which does not exist here and
// would have been ignored by the cached transporter anyway.
const { sendMail, verify } = vi.hoisted(() => ({
  sendMail: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail, verify })),
  },
}));

// Mock React Email render
vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html><body>Test email</body></html>"),
}));

import { EmailService } from "../../lib/email-service";

describe("EmailService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMail.mockResolvedValue({ messageId: "test-message-id" });
    verify.mockResolvedValue(true);

    // Set test environment variables
    process.env.SMTP_HOST = "localhost";
    process.env.SMTP_PORT = "1025";
    process.env.SMTP_USER = "test@example.com";
    process.env.SMTP_PASS = "testpass";
    process.env.SMTP_FROM_NAME = "Test App";
    process.env.SMTP_FROM_ADDRESS = "noreply@test.com";
    process.env.SMTP_SECURE = "false";
  });

  test("should send password reset email successfully", async () => {
    const result = await EmailService.sendPasswordReset({
      to: "user@example.com",
      userName: "Test User",
      resetUrl: "http://localhost:3000/reset-password?token=abc123",
      token: "abc123",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("test-message-id");
    expect(result.error).toBeUndefined();
  });

  test("should validate SMTP configuration", async () => {
    const isValid = await EmailService.validateConfiguration();
    expect(isValid).toBe(true);
  });

  test("should handle email delivery failures gracefully", async () => {
    sendMail.mockRejectedValue(new Error("SMTP Error"));

    const result = await EmailService.sendPasswordReset({
      to: "user@example.com",
      userName: "Test User",
      resetUrl: "http://localhost:3000/reset-password?token=abc123",
      token: "abc123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("SMTP Error");
  });
});
