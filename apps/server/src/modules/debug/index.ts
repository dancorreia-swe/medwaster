import { Elysia } from "elysia";
import { betterAuthMacro, ROLES } from "@/lib/auth";

export class SentryTestError extends Error {
  constructor() {
    super("Sentry test error triggered from /api/admin/debug/sentry-error");
    this.name = "SentryTestError";
  }
}

/**
 * Super-admin-only endpoints for verifying observability in a deployed
 * environment. Hitting this route should produce an issue in Sentry tagged
 * service=api (only when SENTRY_DSN is set).
 */
export const adminDebug = new Elysia({ prefix: "/admin/debug" })
  .use(betterAuthMacro)
  .guard({ auth: true, role: [ROLES.SUPER_ADMIN] }, (app) =>
    app.get(
      "/sentry-error",
      () => {
        throw new SentryTestError();
      },
      {
        detail: {
          tags: ["Admin", "Debug"],
          summary: "Throw a test error",
          description:
            "Throws an unhandled error so the Sentry integration can be verified.",
        },
      },
    ),
  );
