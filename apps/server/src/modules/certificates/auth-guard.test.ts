import { describe, expect, it, vi } from "vitest";

const { getUserCertificate } = vi.hoisted(() => ({
  getUserCertificate: vi.fn(),
}));

vi.mock("./certificates.service", () => ({
  CertificateService: {
    getUserCertificate,
  },
}));

vi.mock("@/lib/auth", async () => {
  const { Elysia, status } = await import("elysia");

  const betterAuthMacro = new Elysia({ name: "test-auth" }).macro({
    auth: {
      resolve() {
        throw status(401, {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        });
      },
    },
  });

  return {
    betterAuthMacro,
    ROLES: {
      ADMIN: "admin",
      SUPER_ADMIN: "super-admin",
    },
  };
});

import { studentCertificates } from "./index";

describe("student certificate auth guard", () => {
  it("rejects unauthenticated certificate downloads before reading user", async () => {
    const response = await studentCertificates.handle(
      new Request("http://localhost/certificates/download/123"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    expect(getUserCertificate).not.toHaveBeenCalled();
  });
});
