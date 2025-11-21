import { boolean, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Global system configuration (single-row table).
 * Extend with new flags as needed.
 */
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  autoApproveCertificates: boolean("auto_approve_certificates")
    .notNull()
    .default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const systemConfigRelations = relations(systemConfig, () => ({}));

export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;
