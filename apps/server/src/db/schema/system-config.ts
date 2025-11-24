import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Global system configuration (single-row table).
 * Extend with new flags as needed.
 */
export const certificateUnlockRequirementValues = [
  "trails",
  "articles",
  "trails_and_articles",
] as const;

export const certificateUnlockRequirementEnum = pgEnum(
  "certificate_unlock_requirement",
  certificateUnlockRequirementValues,
);

export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  autoApproveCertificates: boolean("auto_approve_certificates")
    .notNull()
    .default(false),
  certificateTitle: text("certificate_title")
    .notNull()
    .default("Conclusão de Trilhas"),
  certificateUnlockRequirement: certificateUnlockRequirementEnum(
    "certificate_unlock_requirement",
  )
    .notNull()
    .default("trails"),
  certificateMinStudyHours: integer("certificate_min_study_hours")
    .notNull()
    .default(0),
  certificateMaxStudyHours: integer("certificate_max_study_hours")
    .notNull()
    .default(0),
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
