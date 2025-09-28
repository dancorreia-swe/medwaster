import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "../db";
import { admin } from "better-auth/plugins";
import * as schema from "../db/schema/auth";
import Elysia from "elysia";
import { EmailService } from "./email-service";
import { AuditService } from "../modules/audit/audit.service";
import { RateLimitMonitor } from "./rate-limit-monitor";

export const auth = betterAuth({
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || "", "my-better-t-app://"],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      const clientIP = request
        ? AuditService.getClientIP(request)
        : "127.0.0.1";
      const userAgent = request ? request.headers.get("user-agent") || "" : "";

      await RateLimitMonitor.trackRequest(user.email, "password-reset");

      await AuditService.log(
        {
          eventType: "password_reset_requested",
          userId: user.id,
          additionalContext: {
            email: user.email,
            token: token.substring(0, 8) + "...",
          },
        },
        {
          ipAddress: clientIP,
          userAgent: userAgent,
        },
      );

      const result = await EmailService.sendPasswordReset({
        to: user.email,
        userName: user.name || user.email,
        resetUrl: url,
        token: token,
      });

      if (!result.success) {
        await AuditService.log(
          {
            eventType: "password_reset_email_failed",
            userId: user.id,
            additionalContext: {
              error: result.error,
              email: user.email,
            },
          },
          {
            ipAddress: clientIP,
            userAgent: userAgent,
          },
        );
      }
    },
    onPasswordReset: async ({ user }, request) => {
      const clientIP = request
        ? AuditService.getClientIP(request)
        : "127.0.0.1";
      const userAgent = request ? request.headers.get("user-agent") || "" : "";

      await AuditService.log(
        {
          eventType: "password_reset_completed",
          userId: user.id,
          additionalContext: {
            email: user.email,
          },
        },
        {
          ipAddress: clientIP,
          userAgent: userAgent,
        },
      );
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [
    expo(),
    admin({
      defaultRole: "user",
      adminRoles: ["admin", "super-admin"],
    }),
  ],
});

export const betterAuthMacro = new Elysia({
  name: "better-auth",
})
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
