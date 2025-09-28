import { db } from "../../db";
import { auditLog } from "../../db/schema/audit";
import { user, session } from "../../db/schema/auth";
import { 
  and, 
  or, 
  eq, 
  gte, 
  lte, 
  desc, 
  asc, 
  count, 
  ilike, 
  inArray,
  SQL,
  sql
} from "drizzle-orm";
import type { AuditListParams } from "./audit.validators";
import type { AuditEventType } from "../../db/schema/audit";

export interface AuditLogEntry {
  id: string;
  eventType: string;
  userId: string | null;
  sessionId: string | null;
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
  resourceType: string | null;
  resourceId: string | null;
  oldValues: any;
  newValues: any;
  additionalContext: any;
  checksum: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  session?: {
    id: string;
    createdAt: Date;
    expiresAt: Date;
  } | null;
}

export interface AuditSearchResult {
  data: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function searchAuditLogs(params: AuditListParams): Promise<AuditSearchResult> {
  const filters = buildFilters(params);
  const whereClause = filters.length ? and(...filters) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(auditLog)
    .where(whereClause);

  const total = totalResult[0]?.count ?? 0;

  // Get paginated results with joins
  const offset = (params.page - 1) * params.limit;
  
  const results = await db
    .select({
      id: auditLog.id,
      eventType: auditLog.eventType,
      userId: auditLog.userId,
      sessionId: auditLog.sessionId,
      timestamp: auditLog.timestamp,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      resourceType: auditLog.resourceType,
      resourceId: auditLog.resourceId,
      oldValues: auditLog.oldValues,
      newValues: auditLog.newValues,
      additionalContext: auditLog.additionalContext,
      checksum: auditLog.checksum,
      userName: user.name,
      userEmail: user.email,
      sessionCreatedAt: session.createdAt,
      sessionExpiresAt: session.expiresAt,
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.userId, user.id))
    .leftJoin(session, eq(auditLog.sessionId, session.id))
    .where(whereClause)
    .orderBy(desc(auditLog.timestamp))
    .limit(params.limit)
    .offset(offset);

  const data: AuditLogEntry[] = results.map(row => ({
    id: row.id,
    eventType: row.eventType,
    userId: row.userId,
    sessionId: row.sessionId,
    timestamp: row.timestamp,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    oldValues: row.oldValues,
    newValues: row.newValues,
    additionalContext: row.additionalContext,
    checksum: row.checksum,
    user: row.userId && row.userName ? {
      id: row.userId,
      name: row.userName,
      email: row.userEmail!,
    } : null,
    session: row.sessionId ? {
      id: row.sessionId,
      createdAt: row.sessionCreatedAt!,
      expiresAt: row.sessionExpiresAt!,
    } : null,
  }));

  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1,
    },
  };
}

export async function getAuditLogById(id: string): Promise<AuditLogEntry | null> {
  const result = await db
    .select({
      id: auditLog.id,
      eventType: auditLog.eventType,
      userId: auditLog.userId,
      sessionId: auditLog.sessionId,
      timestamp: auditLog.timestamp,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      resourceType: auditLog.resourceType,
      resourceId: auditLog.resourceId,
      oldValues: auditLog.oldValues,
      newValues: auditLog.newValues,
      additionalContext: auditLog.additionalContext,
      checksum: auditLog.checksum,
      userName: user.name,
      userEmail: user.email,
      sessionCreatedAt: session.createdAt,
      sessionExpiresAt: session.expiresAt,
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.userId, user.id))
    .leftJoin(session, eq(auditLog.sessionId, session.id))
    .where(eq(auditLog.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const row = result[0];
  return {
    id: row.id,
    eventType: row.eventType,
    userId: row.userId,
    sessionId: row.sessionId,
    timestamp: row.timestamp,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    oldValues: row.oldValues,
    newValues: row.newValues,
    additionalContext: row.additionalContext,
    checksum: row.checksum,
    user: row.userId && row.userName ? {
      id: row.userId,
      name: row.userName,
      email: row.userEmail!,
    } : null,
    session: row.sessionId ? {
      id: row.sessionId,
      createdAt: row.sessionCreatedAt!,
      expiresAt: row.sessionExpiresAt!,
    } : null,
  };
}

export async function getAuditStatistics(period: '7d' | '30d' | '90d' | '1y' = '30d') {
  const periodDays = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };

  const days = periodDays[period];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get event breakdown
  const eventBreakdown = await db
    .select({
      eventType: auditLog.eventType,
      count: count(),
    })
    .from(auditLog)
    .where(gte(auditLog.timestamp, startDate))
    .groupBy(auditLog.eventType);

  // Get total events
  const totalEvents = eventBreakdown.reduce((sum, event) => sum + event.count, 0);

  // Get top users by activity
  const topUsers = await db
    .select({
      userId: auditLog.userId,
      userName: user.name,
      count: count(),
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.userId, user.id))
    .where(and(
      gte(auditLog.timestamp, startDate),
      sql`${auditLog.userId} IS NOT NULL`
    ))
    .groupBy(auditLog.userId, user.name)
    .orderBy(desc(count()))
    .limit(10);

  return {
    period,
    totalEvents,
    eventBreakdown: Object.fromEntries(
      eventBreakdown.map(event => [event.eventType, event.count])
    ),
    topUsers: topUsers.map(user => ({
      userId: user.userId!,
      userName: user.userName || 'Unknown',
      eventCount: user.count,
    })),
  };
}

function buildFilters(params: AuditListParams): SQL<unknown>[] {
  const filters: SQL<unknown>[] = [];

  if (params.eventType && params.eventType.length > 0) {
    filters.push(inArray(auditLog.eventType, params.eventType));
  }

  if (params.userId) {
    filters.push(eq(auditLog.userId, params.userId));
  }

  if (params.sessionId) {
    filters.push(eq(auditLog.sessionId, params.sessionId));
  }

  if (params.resourceType) {
    filters.push(eq(auditLog.resourceType, params.resourceType));
  }

  if (params.resourceId) {
    filters.push(eq(auditLog.resourceId, params.resourceId));
  }

  if (params.ipAddress) {
    filters.push(eq(auditLog.ipAddress, params.ipAddress));
  }

  if (params.startDate) {
    filters.push(gte(auditLog.timestamp, params.startDate));
  }

  if (params.endDate) {
    filters.push(lte(auditLog.timestamp, params.endDate));
  }

  if (params.search) {
    const searchTerm = `%${params.search.replace(/%/g, "")}%`;
    const searchCondition = or(
      ilike(auditLog.eventType, searchTerm),
      ilike(auditLog.resourceType, searchTerm),
      sql`${auditLog.additionalContext}::text ILIKE ${searchTerm}`
    );
    if (searchCondition) {
      filters.push(searchCondition);
    }
  }

  return filters;
}