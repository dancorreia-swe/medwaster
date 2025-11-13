import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const certificateStatusValues = [
  "pending",
  "approved",
  "rejected",
  "revoked",
] as const;
export const certificateStatusEnum = pgEnum(
  "certificate_status",
  certificateStatusValues,
);

export const certificates = pgTable(
  "certificates",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").notNull().defaultRandom().unique(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    status: certificateStatusEnum("status").notNull().default("pending"),

    averageScore: real("average_score").notNull(),
    totalTrailsCompleted: integer("total_trails_completed").notNull(),
    totalTimeMinutes: integer("total_time_minutes").notNull(),
    allTrailsCompletedAt: timestamp("all_trails_completed_at", {
      withTimezone: true,
    }).notNull(),

    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: text("review_notes"),

    verificationCode: text("verification_code").notNull().unique(),
    certificateUrl: text("certificate_url"),

    issuedAt: timestamp("issued_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("certificates_user_idx").on(table.userId),
    index("certificates_status_idx").on(table.status),
    index("certificates_verification_idx").on(table.verificationCode),
    index("certificates_reviewed_by_idx").on(table.reviewedBy),
    index("certificates_issued_at_idx").on(table.issuedAt),
  ],
);

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(user, {
    fields: [certificates.userId],
    references: [user.id],
  }),
  reviewer: one(user, {
    fields: [certificates.reviewedBy],
    references: [user.id],
  }),
}));

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
export type CertificateStatus = (typeof certificateStatusValues)[number];
