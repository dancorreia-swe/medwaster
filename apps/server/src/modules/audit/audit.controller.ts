import { Elysia } from "elysia";
import { AuditService } from "./audit.service";
import {
  auditListQuerySchema,
  auditExportSchema,
  auditStatsQuerySchema,
  normalizeAuditListParams,
  normalizeExportParams,
} from "./audit.validators";

// Role-based access control helper
function requireAdminRole(userRole: string | null | undefined): boolean {
  return userRole === "admin" || userRole === "super-admin";
}

function requireSuperAdminRole(userRole: string | null | undefined): boolean {
  return userRole === "super-admin";
}

export const auditController = new Elysia({ prefix: "/admin/audit-logs" })
  .derive(({ headers }) => {
    // In a real implementation, this would extract user info from JWT/session
    // For now, we'll assume the role is passed in a header or extracted from Better Auth
    const userRole = headers["x-user-role"] || null;
    return { userRole };
  })
  .get(
    "/",
    async ({ query, userRole, error }) => {
      // Check admin permissions
      if (!requireAdminRole(userRole)) {
        return error(403, {
          error: "insufficient_permissions",
          message: "Admin access required to view audit logs",
        });
      }

      // Log the audit access if we have a user ID
      const userId = headers["x-user-id"] || null;
      if (userId) {
        await AuditService.log({
          eventType: "audit_log_accessed",
          userId,
          additionalContext: { query },
        });
      }

      const params = normalizeAuditListParams(query);
      return await AuditService.search(params);
    },
    {
      query: auditListQuerySchema,
    },
  )

  .get("/:id", async ({ params, userRole, error }) => {
    if (!requireAdminRole(userRole)) {
      return error(403, {
        error: "insufficient_permissions",
        message: "Admin access required",
      });
    }

    const entry = await AuditService.getById(params.id);
    if (!entry) {
      return error(404, {
        error: "not_found",
        message: "Audit log entry not found",
      });
    }

    // Validate integrity
    const isValid = await AuditService.validateIntegrity(params.id);

    return {
      ...entry,
      integrity: isValid ? "valid" : "compromised",
    };
  })

  .get(
    "/stats",
    async ({ query, userRole, error }) => {
      if (!requireAdminRole(userRole)) {
        return error(403, {
          error: "insufficient_permissions",
          message: "Admin access required",
        });
      }

      const period = query?.period || "30d";
      return await AuditService.getStatistics(
        period as "7d" | "30d" | "90d" | "1y",
      );
    },
    {
      query: auditStatsQuerySchema,
    },
  )

  .post(
    "/export",
    async ({ body, userRole, headers, error }) => {
      // Export requires super-admin role
      if (!requireSuperAdminRole(userRole)) {
        return error(403, {
          error: "insufficient_permissions",
          message: "Super admin access required for audit log export",
        });
      }

      // Log the export request
      const userId = headers["x-user-id"] || null;
      if (userId) {
        await AuditService.log({
          eventType: "audit_log_exported",
          userId,
          additionalContext: {
            format: body.format,
            maxRecords: body.maxRecords,
          },
        });
      }

      const params = normalizeExportParams(body);
      return await AuditService.export(params);
    },
    {
      body: auditExportSchema,
    },
  );

