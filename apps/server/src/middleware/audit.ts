import { Elysia } from "elysia";
import { AuditService } from "../modules/audit/audit.service";
import type { AuditEventType } from "../db/schema/audit";

interface AuditOptions {
  logSuccess?: boolean;
  logErrors?: boolean;
  logAuthEvents?: boolean;
}

export const auditMiddleware = (options: AuditOptions = {}) => {
  const opts = {
    logSuccess: true,
    logErrors: true,
    logAuthEvents: true,
    ...options,
  };

  return new Elysia({ name: "audit-middleware" })
    .derive(({ request }) => {
      return {
        auditContext: {
          ipAddress: AuditService.getClientIP(request),
          userAgent: request.headers.get("user-agent") || "",
          timestamp: new Date(),
        },
      };
    })
    .onAfterHandle(async (context) => {
      try {
        const { response, auditContext, request } = context as any;

        if (!opts.logSuccess || (response?.status && response.status >= 400))
          return;

        const url = new URL(request.url);
        const eventType = mapRouteToEventType(url.pathname);

        if (eventType && opts.logAuthEvents) {
          await AuditService.log(
            {
              eventType,
              resourceType: "auth",
              additionalContext: {
                path: url.pathname,
                method: request.method,
                status: response?.status || 200,
              },
            },
            auditContext,
          );
        }
      } catch (error) {
        console.error("Audit middleware success logging error:", error);
      }
    })
    .onError(async (context) => {
      try {
        const { error, auditContext, request } = context as any;

        if (!opts.logErrors) return;

        const url = new URL(request.url);
        const isAuthRoute = url.pathname.startsWith("/api/auth");

        if (isAuthRoute) {
          const errorMessage =
            error?.message || error?.toString() || "Unknown error";

          await AuditService.log(
            {
              eventType: mapErrorToEventType(error, url.pathname),
              resourceType: "auth",
              additionalContext: {
                error: errorMessage,
                path: url.pathname,
                method: request.method,
              },
            },
            auditContext,
          );
        }
      } catch (auditError) {
        console.error("Audit middleware error logging failed:", auditError);
      }
    });
};

function mapRouteToEventType(pathname: string): AuditEventType | null {
  // Map Better Auth routes to audit event types
  if (pathname.includes("/sign-in") || pathname.includes("/signin")) {
    return "login_success";
  }
  if (pathname.includes("/sign-out") || pathname.includes("/signout")) {
    return "logout";
  }
  if (pathname.includes("/sign-up") || pathname.includes("/signup")) {
    return "user_created";
  }

  // Don't log password reset events here - they're handled in the auth callbacks

  return null;
}

function mapErrorToEventType(error: any, pathname: string): AuditEventType {
  if (pathname.includes("/sign-in") || pathname.includes("/signin")) {
    return "login_failure";
  }

  if (pathname.includes("/reset-password")) {
    return "password_reset_token_invalid";
  }

  const errorMessage = error?.message?.toLowerCase() || "";
  if (errorMessage.includes("unauthorized")) {
    return "unauthorized_access_attempt";
  }

  // Default for auth-related errors
  return "login_failure";
}

// Helper function to check if a route should be audited
export function isAuditableRoute(pathname: string): boolean {
  return pathname.startsWith("/api/auth") || pathname.startsWith("/api/admin");
}

// Export utility for manual audit logging
export { AuditService as auditLogger };

