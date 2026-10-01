import { describe, expect, it } from "vitest";
import type { Event } from "@sentry/elysia";
import { scrubBreadcrumb, scrubEvent, scrubUrl } from "./sentry";

describe("scrubUrl", () => {
  it("filters credential-like query params and keeps the rest", () => {
    expect(
      scrubUrl("https://api.example.com/reset?token=abc123&lang=pt&code=999"),
    ).toBe(
      "https://api.example.com/reset?token=[Filtered]&lang=pt&code=[Filtered]",
    );
  });

  it("filters presigned S3 signatures", () => {
    expect(scrubUrl("https://s3/x.png?X-Amz-Signature=deadbeef")).toBe(
      "https://s3/x.png?X-Amz-Signature=[Filtered]",
    );
  });
});

describe("scrubEvent", () => {
  it("removes cookies, bodies and auth headers from the request", () => {
    const event: Event = {
      request: {
        url: "https://api.example.com/api/profile?token=secret",
        cookies: { "better-auth.session_token": "s" },
        data: { password: "hunter2" },
        headers: {
          Authorization: "Bearer abc",
          cookie: "a=b",
          "user-agent": "jest",
        },
        query_string: "token=secret&page=2",
      },
    };

    const scrubbed = scrubEvent(event);

    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.data).toBeUndefined();
    expect(scrubbed.request?.headers).toEqual({
      Authorization: "[Filtered]",
      cookie: "[Filtered]",
      "user-agent": "jest",
    });
    expect(scrubbed.request?.url).toBe(
      "https://api.example.com/api/profile?token=[Filtered]",
    );
    expect(scrubbed.request?.query_string).toBe("token=[Filtered]&page=2");
  });

  it("keeps only the user id", () => {
    const scrubbed = scrubEvent({
      user: { id: "u1", email: "a@b.c", username: "Ana", ip_address: "1.2.3.4" },
    });
    expect(scrubbed.user).toEqual({ id: "u1" });
  });

  it("drops the user entirely when there is no id", () => {
    expect(scrubEvent({ user: { email: "a@b.c" } }).user).toBeUndefined();
  });
});

describe("scrubBreadcrumb", () => {
  it("filters tokens in breadcrumb urls", () => {
    const crumb = scrubBreadcrumb({
      category: "fetch",
      data: { url: "https://api/x?access_token=t", method: "GET" },
    });
    expect(crumb?.data).toEqual({
      url: "https://api/x?access_token=[Filtered]",
      method: "GET",
    });
  });

  it("drops console breadcrumbs", () => {
    expect(scrubBreadcrumb({ category: "console", message: "a@b.c" })).toBeNull();
  });
});
