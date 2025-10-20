import { describe, test, expect, vi, beforeEach } from "vitest";
import { EmailService } from "../../lib/email-service";

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
      verify: vi.fn().mockResolvedValue(true),
    })),
  },
}));

// Mock React Email render
vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<html><body>Test email</body></html>"),
}));

describe("EmailService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
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
    // Mock nodemailer to throw an error
    const mockSendMail = vi.fn().mockRejectedValue(new Error("SMTP Error"));
    vi.mocked(require("nodemailer").default.createTransport).mockReturnValue({
      sendMail: mockSendMail,
      verify: vi.fn().mockResolvedValue(true),
    });

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
