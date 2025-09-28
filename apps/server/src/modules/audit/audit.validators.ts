import { z } from "zod";

// Audit log query parameters schema
export const auditListQuerySchema = z
  .object({
    page: z.coerce.number().int().gte(1).optional(),
    limit: z.coerce.number().int().gte(1).lte(100).optional(),
    eventType: z.union([z.string(), z.array(z.string())]).optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    resourceType: z.string().optional(),
    resourceId: z.string().optional(),
    ipAddress: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().trim().max(200).optional(),
  })
  .optional()
  .default({});

export type AuditListQueryInput = z.infer<typeof auditListQuerySchema>;

export interface AuditListParams {
  page: number;
  limit: number;
  eventType?: string[];
  userId?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export function normalizeAuditListParams(input: AuditListQueryInput): AuditListParams {
  const page = input?.page && input.page >= 1 ? input.page : 1;
  const limit = input?.limit && input.limit >= 1 && input.limit <= 100 ? input.limit : 50;
  
  const eventType = input?.eventType
    ? Array.isArray(input.eventType)
      ? input.eventType.filter(Boolean)
      : [input.eventType].filter(Boolean)
    : undefined;

  const startDate = input?.startDate ? parseDate(input.startDate) : undefined;
  const endDate = input?.endDate ? parseDate(input.endDate, { endOfDay: true }) : undefined;

  return {
    page,
    limit,
    eventType,
    userId: input?.userId,
    sessionId: input?.sessionId,
    resourceType: input?.resourceType,
    resourceId: input?.resourceId,
    ipAddress: input?.ipAddress,
    startDate,
    endDate,
    search: input?.search,
  };
}

// Audit log export schema
export const auditExportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']),
  filters: auditListQuerySchema,
  fields: z.array(z.string()).optional(),
  includeUserDetails: z.boolean().optional(),
  maxRecords: z.coerce.number().int().gte(1).lte(50000).optional(),
});

export type AuditExportParams = z.infer<typeof auditExportSchema>;

export function normalizeExportParams(input: AuditExportParams): AuditExportParams {
  return {
    format: input.format,
    filters: input.filters,
    fields: input.fields,
    includeUserDetails: input.includeUserDetails ?? false,
    maxRecords: input.maxRecords ?? 10000,
  };
}

// Audit statistics query
export const auditStatsQuerySchema = z
  .object({
    period: z.enum(['7d', '30d', '90d', '1y']).optional(),
  })
  .optional()
  .default({});

export type AuditStatsQuery = z.infer<typeof auditStatsQuerySchema>;

// Helper functions
function parseDate(value: string, options?: { endOfDay?: boolean }): Date | undefined {
  if (!value) return undefined;
  
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  
  if (options?.endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  
  return date;
}

// Rate limit monitor schemas
export const rateLimitCheckSchema = z.object({
  identifier: z.string(),
  endpoint: z.string(),
});

export type RateLimitCheckParams = z.infer<typeof rateLimitCheckSchema>;