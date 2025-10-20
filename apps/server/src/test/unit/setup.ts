import { beforeAll, beforeEach, afterEach, afterAll, vi } from "vitest";

// Setup test environment
beforeAll(() => {
  console.log("🧪 Setting up test environment...");

  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.SMTP_HOST = "localhost";
  process.env.SMTP_PORT = "1025";
  process.env.SMTP_USER = "test@example.com";
  process.env.SMTP_PASS = "testpass";
  process.env.SMTP_FROM_NAME = "Test App";
  process.env.SMTP_FROM_ADDRESS = "noreply@test.com";
  process.env.SMTP_SECURE = "false";
  process.env.AUDIT_CHECKSUM_SECRET = "test-secret-key";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});

afterAll(() => {
  console.log("🏁 Test suite completed");
});

