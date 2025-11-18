import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "../db";
import { admin, openAPI } from "better-auth/plugins";
import * as schema from "../db/schema/auth";
import Elysia from "elysia";
import { EmailService } from "./email-service";
import { AuditService } from "../modules/audit/audit.service";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { RateLimitMonitor } from "./rate-limit-monitor";
import { createAuthMiddleware } from "better-auth/api";
import { trackFirstLogin } from "../modules/achievements/trackers";
import { eq } from "drizzle-orm";

export const ROLES = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  USER: "user",
};

type Roles = (typeof ROLES)[keyof typeof ROLES];

export const auth = betterAuth({
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [
    process.env.CORS_ORIGIN || "",
    "medwaster://",
    "exp://",
  ],
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
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    expo(),
    openAPI(),
    admin({
      defaultRole: "user",
      adminRoles: ["admin", "super-admin"],
    }),
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Detect first login on sign-in paths (email, OAuth)
      // Path examples: /sign-in/email, /sign-in/social, /callback/google
      const isSignIn = ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/callback");
      const isSignUp = ctx.path.startsWith("/sign-up");
      
      if (isSignIn && !isSignUp) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          const user = newSession.user;
          
          // Check if this is the first login (firstLoginAt is null)
          if (!user.firstLoginAt) {
            // Update user with firstLoginAt timestamp
            await db
              .update(schema.user)
              .set({ firstLoginAt: new Date() })
              .where(eq(schema.user.id, user.id));
            
            // Track first login achievement
            await trackFirstLogin(user.id);
            
            console.log(`🎯 First login tracked for user ${user.id}`);
          }
        }
      }
    }),
  },
});

export const betterAuthMacro = new Elysia({
  name: "better-auth",
})
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ request }) {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session) {
          throw new UnauthorizedError("Authentication required");
        }

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
    role: (role: string | string[] | Roles | Roles[]) => ({
      resolve: ({ user }) => {
        if (!role) return;

        if (!user) {
          throw new UnauthorizedError("Authentication required");
        }

        const userRole = user.role || "user";

        if (userRole === ROLES.SUPER_ADMIN) {
          return;
        }

        if (role && typeof role === "string" && userRole !== role) {
          throw new ForbiddenError("Insufficient permissions");
        }

        if (role && Array.isArray(role) && !role.includes(userRole)) {
          throw new ForbiddenError("Insufficient permissions");
        }
      },
    }),
  });

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
  getPaths: (prefix = "/auth/api") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path];

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method];

          operation.tags = ["Better Auth"];
        }
      }

      return reference;
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;
