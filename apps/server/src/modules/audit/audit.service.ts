import { db } from "../../db";
import { auditLog } from "../../db/schema/audit";
import type { AuditEventType } from "../../db/schema/audit";
import { searchAuditLogs, getAuditLogById, getAuditStatistics } from "./audit.queries";
import type { AuditListParams, AuditExportParams } from "./audit.validators";
import { ulid } from "ulid";
import { createHmac } from "crypto";

export interface CreateAuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  additionalContext?: Record<string, any>;
}

export interface RequestContext {
  ipAddress: string;
  userAgent: string;
  timestamp?: Date;
}

export abstract class AuditService {
  static async log(entry: CreateAuditLogEntry, context?: RequestContext): Promise<string> {
    try {
      const id = ulid();
      const timestamp = context?.timestamp || new Date();
      
      const checksum = this.calculateChecksum(id, entry, context);

      await db.insert(auditLog).values({
        id,
        eventType: entry.eventType,
        userId: entry.userId || null,
        sessionId: entry.sessionId || null,
        timestamp,
        ipAddress: context?.ipAddress || null,
        userAgent: context?.userAgent || null,
        resourceType: entry.resourceType || null,
        resourceId: entry.resourceId || null,
        oldValues: entry.oldValues || null,
        newValues: entry.newValues || null,
        additionalContext: entry.additionalContext || null,
        checksum,
      });

      return id;
    } catch (error) {
      console.error('Audit logging error:', error);
      throw error;
    }
  }

  static async search(params: AuditListParams) {
    return await searchAuditLogs(params);
  }

  static async getById(id: string) {
    return await getAuditLogById(id);
  }

  static async validateIntegrity(logId: string): Promise<boolean> {
    try {
      const entry = await getAuditLogById(logId);
      if (!entry) {
        return false;
      }

      const expectedChecksum = this.calculateChecksum(
        entry.id,
        {
          eventType: entry.eventType as AuditEventType,
          userId: entry.userId || undefined,
          sessionId: entry.sessionId || undefined,
          resourceType: entry.resourceType || undefined,
          resourceId: entry.resourceId || undefined,
          oldValues: entry.oldValues,
          newValues: entry.newValues,
          additionalContext: entry.additionalContext,
        },
        {
          ipAddress: entry.ipAddress || '',
          userAgent: entry.userAgent || '',
          timestamp: entry.timestamp,
        }
      );

      return entry.checksum === expectedChecksum;
    } catch (error) {
      console.error('Integrity validation error:', error);
      return false;
    }
  }

  static async export(params: AuditExportParams) {
    // For now, return a simple export structure
    // In production, you'd implement actual file generation
    const searchParams: AuditListParams = {
      page: 1,
      limit: params.maxRecords || 10000,
      eventType: params.filters?.eventType ? 
        (Array.isArray(params.filters.eventType) ? params.filters.eventType : [params.filters.eventType]) : 
        undefined,
      userId: params.filters?.userId,
      sessionId: params.filters?.sessionId,
      resourceType: params.filters?.resourceType,
      resourceId: params.filters?.resourceId,
      ipAddress: params.filters?.ipAddress,
      search: params.filters?.search,
    };

    const results = await this.search(searchParams);

    return {
      exportId: ulid(),
      format: params.format,
      recordCount: results.data.length,
      data: results.data,
      generatedAt: new Date().toISOString(),
    };
  }

  static async getStatistics(period: '7d' | '30d' | '90d' | '1y' = '30d') {
    return await getAuditStatistics(period);
  }

  private static calculateChecksum(
    id: string, 
    entry: CreateAuditLogEntry, 
    context?: RequestContext
  ): string {
    const secret = process.env.AUDIT_CHECKSUM_SECRET || 'default-secret-change-in-production';
    
    const data = {
      id,
      eventType: entry.eventType,
      userId: entry.userId,
      sessionId: entry.sessionId,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      additionalContext: entry.additionalContext,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      timestamp: context?.timestamp?.toISOString(),
    };

    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return createHmac('sha256', secret).update(dataString).digest('hex');
  }

  // Utility method to get client IP from request
  static getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback for development
    return '127.0.0.1';
  }
}
