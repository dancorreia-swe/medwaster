import { db } from "../db";
import { rateLimitMonitor } from "../db/schema/audit";
import { eq, and, lt } from "drizzle-orm";
import { ulid } from "ulid";

export interface RateLimitConfig {
  maxAttempts: number;
  windowDuration: number; // in seconds
  alertThreshold: number;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  'password-reset': {
    maxAttempts: 5,
    windowDuration: 3600, // 1 hour
    alertThreshold: 10,
  },
  'login-attempt': {
    maxAttempts: 10,
    windowDuration: 3600, // 1 hour
    alertThreshold: 20,
  },
};

export abstract class RateLimitMonitor {
  static async trackRequest(identifier: string, endpoint: string): Promise<void> {
    try {
      const config = DEFAULT_CONFIGS[endpoint] || DEFAULT_CONFIGS['password-reset'];
      const now = new Date();
      const windowStart = new Date(now.getTime() - (config.windowDuration * 1000));

      // Clean up old entries
      await db.delete(rateLimitMonitor)
        .where(and(
          eq(rateLimitMonitor.identifier, identifier),
          eq(rateLimitMonitor.endpoint, endpoint),
          lt(rateLimitMonitor.windowStart, windowStart)
        ));

      // Get or create current tracking record
      const existing = await db.select()
        .from(rateLimitMonitor)
        .where(and(
          eq(rateLimitMonitor.identifier, identifier),
          eq(rateLimitMonitor.endpoint, endpoint)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db.update(rateLimitMonitor)
          .set({
            attemptCount: existing[0].attemptCount + 1,
            lastAttempt: now,
          })
          .where(eq(rateLimitMonitor.id, existing[0].id));
      } else {
        // Create new tracking record
        await db.insert(rateLimitMonitor).values({
          id: ulid(),
          identifier,
          endpoint,
          attemptCount: 1,
          windowStart: now,
          lastAttempt: now,
          alertThreshold: config.alertThreshold,
        });
      }
    } catch (error) {
      console.error('Rate limit tracking error:', error);
      // Don't throw - rate limit monitoring is supplementary
    }
  }

  static async checkExcessiveAttempts(identifier: string, endpoint: string): Promise<boolean> {
    try {
      const config = DEFAULT_CONFIGS[endpoint] || DEFAULT_CONFIGS['password-reset'];
      
      const record = await db.select()
        .from(rateLimitMonitor)
        .where(and(
          eq(rateLimitMonitor.identifier, identifier),
          eq(rateLimitMonitor.endpoint, endpoint)
        ))
        .limit(1);

      if (record.length === 0) {
        return false;
      }

      return record[0].attemptCount >= config.maxAttempts;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return false; // Fail open for monitoring
    }
  }

  static async generateAlert(identifier: string, endpoint: string, attempts: number): Promise<void> {
    try {
      console.warn(`RATE LIMIT ALERT: ${identifier} has made ${attempts} attempts to ${endpoint}`);
      
      // In production, you might:
      // - Send alert to monitoring system
      // - Trigger security notifications
      // - Update threat intelligence feeds
      
    } catch (error) {
      console.error('Alert generation error:', error);
    }
  }

  static async getAttemptCount(identifier: string, endpoint: string): Promise<number> {
    try {
      const record = await db.select()
        .from(rateLimitMonitor)
        .where(and(
          eq(rateLimitMonitor.identifier, identifier),
          eq(rateLimitMonitor.endpoint, endpoint)
        ))
        .limit(1);

      return record.length > 0 ? record[0].attemptCount : 0;
    } catch (error) {
      console.error('Get attempt count error:', error);
      return 0;
    }
  }

  static async resetLimit(identifier: string, endpoint: string): Promise<void> {
    try {
      await db.delete(rateLimitMonitor)
        .where(and(
          eq(rateLimitMonitor.identifier, identifier),
          eq(rateLimitMonitor.endpoint, endpoint)
        ));
    } catch (error) {
      console.error('Reset limit error:', error);
    }
  }
}