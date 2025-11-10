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
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const achievementCategoryValues = [
  "trails",
  "wiki",
  "questions",
  "certification",
  "engagement",
  "social",
  "general",
] as const;
export const achievementCategoryEnum = pgEnum(
  "achievement_category",
  achievementCategoryValues,
);

export const achievementDifficultyValues = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
] as const;
export const achievementDifficultyEnum = pgEnum(
  "achievement_difficulty",
  achievementDifficultyValues,
);

export const achievementStatusValues = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;
export const achievementStatusEnum = pgEnum(
  "achievement_status",
  achievementStatusValues,
);

export const achievementTypeValues = [
  "milestone", // One-time achievements
  "progressive", // Incremental progress (e.g., read 100 articles)
  "streak", // Consecutive days/actions
] as const;
export const achievementTypeEnum = pgEnum(
  "achievement_type",
  achievementTypeValues,
);

export const achievementVisibilityValues = [
  "public", // Fully visible: name, description, requirements
  "secret", // Hidden until earned: doesn't show in list at all
] as const;
export const achievementVisibilityEnum = pgEnum(
  "achievement_visibility",
  achievementVisibilityValues,
);

export const achievements = pgTable(
  "achievements",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(), // URL-friendly identifier
    name: text("name").notNull(),
    description: text("description").notNull(),
    longDescription: text("long_description"), // Detailed explanation

    category: achievementCategoryEnum("category").notNull(),
    difficulty: achievementDifficultyEnum("difficulty")
      .notNull()
      .default("bronze"),
    type: achievementTypeEnum("type").notNull().default("milestone"),
    status: achievementStatusEnum("status").notNull().default("draft"),
    visibility: achievementVisibilityEnum("visibility")
      .notNull()
      .default("public"),

    // Trigger configuration (JSON schema for flexibility)
    triggerConfig: jsonb("trigger_config").notNull(),
    /* Example structure:
    {
      type: "complete_trails",
      conditions: {
        count: 10,
        categoryId?: "specific-category",
        perfectScore?: true,
        sequential?: true,
        timeLimit?: 3600
      },
      timeWindow?: {
        start: "2024-06-01T00:00:00Z",
        end: "2024-08-31T23:59:59Z"
      }
    }
    */

    // Badge/Visual configuration
    badge: jsonb("badge").notNull(),
    /* Example structure:
    {
      type: "icon" | "image" | "svg",
      value: "trophy" | "url" | "<svg>...</svg>",
      color: "#fbbf24",
      backgroundColor: "#1a1a1a",
      animation?: "pulse" | "glow" | "rotate"
    }
    */
    badgeImageKey: text("badge_image_key"), // S3 key for the badge image (for cleanup)

    // Rewards
    rewards: jsonb("rewards").default({}),
    /* Example structure:
    {
      points: 100,
      title?: "Trail Master",
      badge?: "special-badge-id",
      unlocks?: ["feature-id", "content-id"]
    }
    */

    displayOrder: integer("display_order").notNull().default(0),

    // Audit
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "restrict",
    }),

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
    index("achievements_type_idx").on(table.type),
    index("achievements_visibility_idx").on(table.visibility),
    index("achievements_display_order_idx").on(table.displayOrder),
  ],
);

// Achievement prerequisites junction table
export const achievementPrerequisites = pgTable(
  "achievement_prerequisites",
  {
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    prerequisiteId: integer("prerequisite_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),

    required: boolean("required").notNull().default(true), // If false, it's optional
    orderIndex: integer("order_index").notNull().default(0), // For displaying prerequisite order

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.achievementId, table.prerequisiteId],
    }),
    index("achievement_prerequisites_achievement_idx").on(table.achievementId),
    index("achievement_prerequisites_prerequisite_idx").on(
      table.prerequisiteId,
    ),
  ],
);

export const achievementPrerequisitesRelations = relations(
  achievementPrerequisites,
  ({ one }) => ({
    achievement: one(achievements, {
      fields: [achievementPrerequisites.achievementId],
      references: [achievements.id],
      relationName: "achievementPrerequisites",
    }),
    prerequisite: one(achievements, {
      fields: [achievementPrerequisites.prerequisiteId],
      references: [achievements.id],
      relationName: "prerequisiteFor",
    }),
  }),
);

export const achievementsRelations = relations(
  achievements,
  ({ one, many }) => ({
    createdByUser: one(user, {
      fields: [achievements.createdBy],
      references: [user.id],
      relationName: "createdAchievements",
    }),
    updatedByUser: one(user, {
      fields: [achievements.updatedBy],
      references: [user.id],
      relationName: "updatedAchievements",
    }),
    userAchievements: many(userAchievements),
    achievementHistory: many(achievementHistory),
    prerequisites: many(achievementPrerequisites, {
      relationName: "achievementPrerequisites",
    }),
    prerequisiteFor: many(achievementPrerequisites, {
      relationName: "prerequisiteFor",
    }),
  }),
);

// User achievement progress
export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),

    // Progress tracking
    currentValue: real("current_value").notNull().default(0),
    targetValue: real("target_value").notNull(),
    progressPercentage: real("progress_percentage").notNull().default(0),

    // State
    isUnlocked: boolean("is_unlocked").notNull().default(false),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }),

    // Streak tracking (for streak-type achievements)
    currentStreak: integer("current_streak").default(0),
    longestStreak: integer("longest_streak").default(0),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),

    // Context data for the achievement
    context: jsonb("context").default({}),
    /* Example structure:
    {
      trailsCompleted: ["trail-1", "trail-2"],
      lastTriggeredBy: "event-id",
      metadata: { any: "custom data" }
    }
    */

    // Notification tracking
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }), // For rewards

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
    }),
    index("user_achievements_user_idx").on(table.userId),
    index("user_achievements_achievement_idx").on(table.achievementId),
    index("user_achievements_unlocked_idx").on(
      table.isUnlocked,
      table.unlockedAt,
    ),
    index("user_achievements_progress_idx").on(
      table.userId,
      table.progressPercentage,
    ),
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

// Historical record of achievement unlocks
export const achievementHistory = pgTable(
  "achievement_history",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),

    // What triggered the unlock
    triggerEvent: text("trigger_event").notNull(),
    triggerData: jsonb("trigger_data"),

    // Achievement state at time of unlock (for historical reference)
    achievementSnapshot: jsonb("achievement_snapshot"),

    // Rewards granted
    rewardsGranted: jsonb("rewards_granted"),

    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("achievement_history_user_idx").on(table.userId),
    index("achievement_history_achievement_idx").on(table.achievementId),
    index("achievement_history_unlocked_idx").on(table.unlockedAt),
    unique("achievement_history_user_achievement_unique").on(
      table.userId,
      table.achievementId,
    ),
  ],
);

export const achievementHistoryRelations = relations(
  achievementHistory,
  ({ one }) => ({
    user: one(user, {
      fields: [achievementHistory.userId],
      references: [user.id],
    }),
    achievement: one(achievements, {
      fields: [achievementHistory.achievementId],
      references: [achievements.id],
    }),
  }),
);

// Event tracking for achievement triggers
export const achievementEvents = pgTable(
  "achievement_events",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    eventType: text("event_type").notNull(), // e.g., "trail_completed", "article_read"
    eventData: jsonb("event_data").notNull(),

    // Processing status
    processed: boolean("processed").notNull().default(false),
    processedAt: timestamp("processed_at", { withTimezone: true }),

    // Results
    achievementsEvaluated: integer("achievements_evaluated").default(0),
    achievementsProgressed: jsonb("achievements_progressed").default([]), // Array of achievement IDs
    achievementsUnlocked: jsonb("achievements_unlocked").default([]), // Array of achievement IDs

    errors: jsonb("errors"), // Any errors during processing

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("achievement_events_user_idx").on(table.userId),
    index("achievement_events_type_idx").on(table.eventType),
    index("achievement_events_processed_idx").on(
      table.processed,
      table.createdAt,
    ),
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

// Statistics table (computed periodically)
export const achievementStats = pgTable(
  "achievement_stats",
  {
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" })
      .primaryKey(),

    totalUsers: integer("total_users").notNull().default(0),
    unlockedCount: integer("unlocked_count").notNull().default(0),
    unlockedPercentage: real("unlocked_percentage").notNull().default(0),

    averageProgress: real("average_progress").default(0),
    medianProgress: real("median_progress").default(0),

    averageTimeToUnlock: integer("average_time_to_unlock_seconds"), // in seconds

    lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("achievement_stats_unlocked_pct_idx").on(table.unlockedPercentage),
  ],
);

export const achievementStatsRelations = relations(
  achievementStats,
  ({ one }) => ({
    achievement: one(achievements, {
      fields: [achievementStats.achievementId],
      references: [achievements.id],
    }),
  }),
);

// Type exports
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type AchievementCategory = (typeof achievementCategoryValues)[number];
export type AchievementDifficulty =
  (typeof achievementDifficultyValues)[number];
export type AchievementStatus = (typeof achievementStatusValues)[number];
export type AchievementType = (typeof achievementTypeValues)[number];
export type AchievementVisibility =
  (typeof achievementVisibilityValues)[number];

export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;

export type AchievementHistory = typeof achievementHistory.$inferSelect;
export type NewAchievementHistory = typeof achievementHistory.$inferInsert;

export type AchievementEvent = typeof achievementEvents.$inferSelect;
export type NewAchievementEvent = typeof achievementEvents.$inferInsert;

export type AchievementStats = typeof achievementStats.$inferSelect;

export type AchievementPrerequisite =
  typeof achievementPrerequisites.$inferSelect;
export type NewAchievementPrerequisite =
  typeof achievementPrerequisites.$inferInsert;

// TypeScript types for trigger configs (for frontend/backend type safety)
export type TriggerConfig =
  | {
      type: "complete_trails";
      conditions: {
        count: number;
        categoryId?: string;
        perfectScore?: boolean;
        sequential?: boolean;
      };
      timeWindow?: {
        start: string; // ISO 8601
        end: string; // ISO 8601
      };
    }
  | {
      type: "complete_specific_trail";
      conditions: {
        trailId: string;
        timeLimit?: number; // seconds
        perfectScore?: boolean;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "complete_trails_perfect";
      conditions: {
        count: number;
        categoryId?: string;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "complete_trails_sequence";
      conditions: {
        trailIds: string[];
        requireOrder: boolean;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "read_category_complete";
      conditions: {
        categoryId: string;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "read_articles_count";
      conditions: {
        count: number;
        categoryId?: string;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "read_time_total";
      conditions: {
        timeSeconds: number;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "read_specific_article";
      conditions: {
        articleId: string;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "bookmark_articles_count";
      conditions: {
        count: number;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "question_streak_correct";
      conditions: {
        streakDays: number;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "questions_answered_count";
      conditions: {
        count: number;
        categoryId?: string;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "question_accuracy_rate";
      conditions: {
        accuracyPercentage: number;
        minimumQuestions: number;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "answer_hard_question";
      conditions: {
        count: number;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "complete_quiz_count";
      conditions: {
        count: number;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "first_certificate";
      conditions: Record<string, never>; // No conditions
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "certificate_high_score";
      conditions: {
        scorePercentage: number;
        certificateId?: string;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "certificate_fast_approval";
      conditions: {
        timeSeconds: number;
        certificateId?: string;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "onboarding_complete";
      conditions: Record<string, never>;
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "first_login";
      conditions: Record<string, never>;
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "login_streak";
      conditions: {
        streakDays: number;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "use_ai_assistant";
      conditions: {
        count: number;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    }
  | {
      type: "manual";
      conditions: {
        description: string;
      };
      timeWindow?: {
        start: string;
        end: string;
      };
    };
