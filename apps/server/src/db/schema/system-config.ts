import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import {
  DEFAULT_CERTIFICATE_DESIGN,
  type CertificateDesign,
} from "../../modules/certificates/design/catalog";

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
  singletonKey: integer("singleton_key").notNull().default(1),
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
  // Layout/Palette ids are validated in the app (normalizeCertificateDesign),
  // not by pg enums, so adding a Palette never needs a migration.
  certificateDesign: jsonb("certificate_design")
    .$type<CertificateDesign>()
    .notNull()
    .default(DEFAULT_CERTIFICATE_DESIGN),
  certificateDesignRevision: integer("certificate_design_revision")
    .notNull()
    .default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  unique("system_config_singleton_key_unique").on(table.singletonKey),
  check("system_config_singleton_key_check", sql`${table.singletonKey} = 1`),
  check(
    "system_config_certificate_design_revision_positive",
    sql`${table.certificateDesignRevision} > 0`,
  ),
]);

export const systemConfigRelations = relations(systemConfig, () => ({}));

export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;
