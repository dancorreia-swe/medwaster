import { pgTable, text, timestamp, jsonb, integer, index } from "drizzle-orm/pg-core";
import { user, session } from "./auth";

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  userId: text("user_id").references(() => user.id),
  sessionId: text("session_id").references(() => session.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  additionalContext: jsonb("additional_context"),
  checksum: text("checksum").notNull(),
}, (table) => ({
  timestampIdx: index("idx_audit_timestamp").on(table.timestamp),
  userIdx: index("idx_audit_user").on(table.userId),
  eventTypeIdx: index("idx_audit_event_type").on(table.eventType),
}));

export const rateLimitMonitor = pgTable("rate_limit_monitor", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  endpoint: text("endpoint").notNull(),
  attemptCount: integer("attempt_count").default(0),
  windowStart: timestamp("window_start").defaultNow().notNull(),
  lastAttempt: timestamp("last_attempt").defaultNow().notNull(),
  alertThreshold: integer("alert_threshold").default(10),
}, (table) => ({
  identifierEndpointIdx: index("idx_monitor_id_endpoint").on(table.identifier, table.endpoint),
}));

// Audit event types enum for reference
export const auditEventTypes = [
  // Authentication Events
  'login_success',
  'login_failure', 
  'logout',
  'session_expired',
  
  // Password Events (Better Auth integration)
  'password_reset_requested',
  'password_reset_email_failed', 
  'password_reset_completed',
  'password_reset_token_invalid',
  
  // User Management
  'user_created',
  'user_updated',
  'user_role_changed',
  'user_banned',
  'user_unbanned',
  
  // Administrative Actions
  'audit_log_accessed',
  'audit_log_exported',
  'system_config_changed',
  
  // Security Events
  'suspicious_activity_detected',
  'rate_limit_exceeded',
  'unauthorized_access_attempt'
] as const;

export type AuditEventType = typeof auditEventTypes[number];