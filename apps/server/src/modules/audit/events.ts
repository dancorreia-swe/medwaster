/**
 * Audit Module Events
 * Event types for audit logging and compliance tracking
 */

import type { EventData } from "../events";

export const AUDIT_EVENTS = {
  LOG_ACCESSED: "audit.log_accessed",
  LOG_EXPORTED: "audit.log_exported",
  LOG_CREATED: "audit.log_created",
} as const;

export interface AuditLogAccessedData extends EventData {
  userId: string;
  query: Record<string, any>;
  resultsCount?: number;
}

export interface AuditLogExportedData extends EventData {
  userId: string;
  format: "json" | "csv";
  recordCount: number;
  filters?: Record<string, any>;
}

export interface AuditLogCreatedData extends EventData {
  userId: string;
  eventType: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
}

// Register events in the global registry
declare module "../events/registry" {
  interface EventRegistry {
    "audit.log_accessed": AuditLogAccessedData;
    "audit.log_exported": AuditLogExportedData;
    "audit.log_created": AuditLogCreatedData;
  }
}

