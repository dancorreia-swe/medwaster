import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const achievementCategoryValues = [
  "trails",
  "wiki",
  "questions",
  "certification",
  "engagement",
  "general",
] as const;
export const achievementCategoryEnum = pgEnum(
  "achievement_category",
  achievementCategoryValues,
);

export const achievementDifficultyValues = ["easy", "medium", "hard"] as const;
export const achievementDifficultyEnum = pgEnum(
  "achievement_difficulty",
  achievementDifficultyValues,
);

export const achievementStatusValues = ["active", "inactive", "archived"] as const;
export const achievementStatusEnum = pgEnum(
  "achievement_status",
  achievementStatusValues,
);

export const achievementTriggerTypeValues = [
  "complete_trails",
  "complete_specific_trail",
  "complete_trails_perfect",
  "complete_trails_sequence",
  "read_category_complete",
  "read_articles_count",
  "read_time_total",
  "read_specific_article",
  "bookmark_articles_count",
  "question_streak_correct",
  "questions_answered_count",
  "question_accuracy_rate",
  "answer_hard_question",
  "complete_quiz_count",
  "first_certificate",
  "certificate_high_score",
  "certificate_fast_approval",
  "onboarding_complete",
  "first_login",
  "login_streak",
  "use_ai_assistant",
  "manual",
] as const;
export const achievementTriggerTypeEnum = pgEnum(
  "achievement_trigger_type",
  achievementTriggerTypeValues,
);

export const achievements = pgTable(
  "achievements",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description").notNull(),
    
    category: achievementCategoryEnum("category").notNull(),
    difficulty: achievementDifficultyEnum("difficulty").notNull().default("medium"),
    status: achievementStatusEnum("status").notNull().default("active"),
    
    triggerType: achievementTriggerTypeEnum("trigger_type").notNull(),
    triggerConfig: jsonb("trigger_config"),
    
    badgeImageUrl: text("badge_image_url"),
    badgeSvg: text("badge_svg"),
    
    customMessage: text("custom_message"),
    displayOrder: integer("display_order").notNull().default(0),
    
    isSecret: boolean("is_secret").notNull().default(false),
    
    obtainedCount: integer("obtained_count").notNull().default(0),
    obtainedPercentage: real("obtained_percentage").notNull().default(0),
    
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("achievements_category_idx").on(table.category),
    index("achievements_difficulty_idx").on(table.difficulty),
    index("achievements_status_idx").on(table.status),
    index("achievements_trigger_type_idx").on(table.triggerType),
    index("achievements_display_order_idx").on(table.displayOrder),
    index("achievements_obtained_count_idx").on(table.obtainedCount),
  ],
);

export const achievementsRelations = relations(achievements, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [achievements.createdBy],
    references: [user.id],
  }),
  userAchievements: many(userAchievements),
}));

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    
    progress: real("progress").notNull().default(0),
    progressMax: real("progress_max").notNull().default(100),
    
    isUnlocked: boolean("is_unlocked").notNull().default(false),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
    
    triggerData: jsonb("trigger_data"),
    
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.achievementId],
      name: "user_achievements_pk",
    }),
    index("user_achievements_user_idx").on(table.userId),
    index("user_achievements_achievement_idx").on(table.achievementId),
    index("user_achievements_unlocked_idx").on(table.isUnlocked, table.unlockedAt),
    index("user_achievements_progress_idx").on(table.userId, table.progress),
  ],
);

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(user, {
      fields: [userAchievements.userId],
      references: [user.id],
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);

export const achievementEvents = pgTable(
  "achievement_events",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    eventType: text("event_type").notNull(),
    eventData: jsonb("event_data"),
    
    achievementsTriggered: integer("achievements_triggered").notNull().default(0),
    achievementsUnlocked: text("achievements_unlocked").notNull().default("[]"),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("achievement_events_user_idx").on(table.userId),
    index("achievement_events_type_idx").on(table.eventType),
    index("achievement_events_created_idx").on(table.createdAt),
  ],
);

export const achievementEventsRelations = relations(
  achievementEvents,
  ({ one }) => ({
    user: one(user, {
      fields: [achievementEvents.userId],
      references: [user.id],
    }),
  }),
);

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type AchievementCategory = (typeof achievementCategoryValues)[number];
export type AchievementDifficulty = (typeof achievementDifficultyValues)[number];
export type AchievementStatus = (typeof achievementStatusValues)[number];
export type AchievementTriggerType = (typeof achievementTriggerTypeValues)[number];

export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;

export type AchievementEvent = typeof achievementEvents.$inferSelect;
export type NewAchievementEvent = typeof achievementEvents.$inferInsert;
