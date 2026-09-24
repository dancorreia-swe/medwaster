import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail,
      verify: vi.fn(async () => true),
    })),
  },
}));

import { EmailService, escapeHtml } from "../../../lib/email-service";

/**
 * `userName` reaches the email-change template straight from `user.name`,
 * which any authenticated user sets via `PATCH /profile` (255 chars, no
 * sanitisation). Unescaped, that is markup injection into mail sent from our
 * own domain.
 */
describe("escapeHtml", () => {
  it("neutralises a link injected through a display name", () => {
    expect(escapeHtml('Ana<a href="https://evil.example">click</a>')).toBe(
      "Ana&lt;a href=&quot;https://evil.example&quot;&gt;click&lt;/a&gt;",
    );
  });

  it("escapes every HTML-significant character", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("escapes ampersands before the entities it introduces", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("leaves ordinary names untouched", () => {
    expect(escapeHtml("Ana Paula Ferreira")).toBe("Ana Paula Ferreira");
    expect(escapeHtml("")).toBe("");
  });
});

describe("sendEmailChangeVerification", () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: "m1" });
  });

  // Guards the call site, not just the helper: dropping `escapeHtml(...)`
  // from the template is the mistake that reintroduces the injection.
  it("escapes the display name in the rendered body", async () => {
    await EmailService.sendEmailChangeVerification({
      to: "ana@new.example",
      userName: '<a href="https://evil.example">clique aqui</a>',
      token: "tok-123",
    });

    const { html } = sendMail.mock.calls[0][0];
    expect(html).not.toContain("<a href=");
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;");
  });

  it("still renders the verification code and recipient", async () => {
    await EmailService.sendEmailChangeVerification({
      to: "ana@new.example",
      userName: "Ana",
      token: "tok-123",
    });

    const call = sendMail.mock.calls[0][0];
    expect(call.to).toBe("ana@new.example");
    expect(call.html).toContain("tok-123");
    expect(call.html).toContain("Hello Ana,");
  });

  it("reports a transport failure instead of throwing", async () => {
    sendMail.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      EmailService.sendEmailChangeVerification({
        to: "ana@new.example",
        userName: "Ana",
        token: "tok-123",
      }),
    ).resolves.toMatchObject({ success: false, error: "ECONNREFUSED" });
  });
});
