import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const missionTypeValues = [
  "complete_questions",
  "complete_quiz",
  "complete_trail_content",
  "read_article",
  "bookmark_articles",
  "login_daily",
  "achieve_score",
  "spend_time_learning",
  "complete_streak",
] as const;
export const missionTypeEnum = pgEnum("mission_type", missionTypeValues);

export const missionFrequencyValues = ["daily", "weekly", "monthly"] as const;
export const missionFrequencyEnum = pgEnum(
  "mission_frequency",
  missionFrequencyValues,
);

export const missionStatusValues = ["active", "inactive", "archived"] as const;
export const missionStatusEnum = pgEnum("mission_status", missionStatusValues);

export const missions = pgTable(
  "missions",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),

    type: missionTypeEnum("type").notNull(),
    frequency: missionFrequencyEnum("frequency").notNull(),
    status: missionStatusEnum("status").notNull().default("active"),

    targetValue: integer("target_value").notNull(),

    iconUrl: text("icon_url"),

    validFrom: timestamp("valid_from", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("missions_type_idx").on(table.type),
    index("missions_frequency_idx").on(table.frequency),
    index("missions_status_idx").on(table.status),
    index("missions_valid_dates_idx").on(table.validFrom, table.validUntil),
  ],
);

export const missionsRelations = relations(missions, ({ many }) => ({
  userMissions: many(userMissions),
}));

export const userMissions = pgTable(
  "user_missions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    missionId: integer("mission_id")
      .notNull()
      .references(() => missions.id, { onDelete: "cascade" }),

    assignedDate: date("assigned_date").notNull(),

    currentProgress: integer("current_progress").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_missions_user_idx").on(table.userId),
    index("user_missions_mission_idx").on(table.missionId),
    index("user_missions_assigned_date_idx").on(table.assignedDate),
    index("user_missions_user_date_idx").on(table.userId, table.assignedDate),
    index("user_missions_completed_idx").on(
      table.isCompleted,
      table.completedAt,
    ),
  ],
);

export const userMissionsRelations = relations(userMissions, ({ one }) => ({
  user: one(user, {
    fields: [userMissions.userId],
    references: [user.id],
  }),
  mission: one(missions, {
    fields: [userMissions.missionId],
    references: [missions.id],
  }),
}));

export const userStreaks = pgTable(
  "user_streaks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),

    lastActivityDate: date("last_activity_date"),
    currentStreakStartDate: date("current_streak_start_date"),

    totalActiveDays: integer("total_active_days").notNull().default(0),

    freezesAvailable: integer("freezes_available").notNull().default(0),
    freezesUsed: integer("freezes_used").notNull().default(0),
    lastFreezeUsedAt: timestamp("last_freeze_used_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_streaks_user_idx").on(table.userId),
    index("user_streaks_current_streak_idx").on(table.currentStreak),
    index("user_streaks_longest_streak_idx").on(table.longestStreak),
    index("user_streaks_last_activity_idx").on(table.lastActivityDate),
  ],
);

export const userStreaksRelations = relations(userStreaks, ({ one, many }) => ({
  user: one(user, {
    fields: [userStreaks.userId],
    references: [user.id],
  }),
  activities: many(userDailyActivities),
}));

export const userDailyActivities = pgTable(
  "user_daily_activities",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    activityDate: date("activity_date").notNull(),

    questionsCompleted: integer("questions_completed").notNull().default(0),
    quizzesCompleted: integer("quizzes_completed").notNull().default(0),
    articlesRead: integer("articles_read").notNull().default(0),
    trailContentCompleted: integer("trail_content_completed")
      .notNull()
      .default(0),

    timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),

    missionsCompleted: integer("missions_completed").notNull().default(0),

    streakDay: integer("streak_day").notNull().default(0),
    freezeUsed: boolean("freeze_used").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_daily_activities_user_idx").on(table.userId),
    index("user_daily_activities_date_idx").on(table.activityDate),
    index("user_daily_activities_user_date_idx").on(
      table.userId,
      table.activityDate,
    ),
  ],
);

export const userDailyActivitiesRelations = relations(
  userDailyActivities,
  ({ one }) => ({
    user: one(user, {
      fields: [userDailyActivities.userId],
      references: [user.id],
    }),
  }),
);

export const streakMilestones = pgTable(
  "streak_milestones",
  {
    id: serial("id").primaryKey(),
    days: integer("days").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),

    badgeUrl: text("badge_url"),
    freezeReward: integer("freeze_reward").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("streak_milestones_days_idx").on(table.days)],
);

export const streakMilestonesRelations = relations(
  streakMilestones,
  ({ many }) => ({
    userAchievements: many(userStreakMilestones),
  }),
);

export const userStreakMilestones = pgTable(
  "user_streak_milestones",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    milestoneId: integer("milestone_id")
      .notNull()
      .references(() => streakMilestones.id, { onDelete: "cascade" }),

    achievedAt: timestamp("achieved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.milestoneId],
      name: "user_streak_milestones_pk",
    }),
    index("user_streak_milestones_user_idx").on(table.userId),
    index("user_streak_milestones_achieved_idx").on(table.achievedAt),
  ],
);

export const userStreakMilestonesRelations = relations(
  userStreakMilestones,
  ({ one }) => ({
    user: one(user, {
      fields: [userStreakMilestones.userId],
      references: [user.id],
    }),
    milestone: one(streakMilestones, {
      fields: [userStreakMilestones.milestoneId],
      references: [streakMilestones.id],
    }),
  }),
);

export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;
export type MissionType = (typeof missionTypeValues)[number];
export type MissionFrequency = (typeof missionFrequencyValues)[number];
export type MissionStatus = (typeof missionStatusValues)[number];

export type UserMission = typeof userMissions.$inferSelect;
export type NewUserMission = typeof userMissions.$inferInsert;

export type UserStreak = typeof userStreaks.$inferSelect;
export type NewUserStreak = typeof userStreaks.$inferInsert;

export type UserDailyActivity = typeof userDailyActivities.$inferSelect;
export type NewUserDailyActivity = typeof userDailyActivities.$inferInsert;

export type StreakMilestone = typeof streakMilestones.$inferSelect;
export type NewStreakMilestone = typeof streakMilestones.$inferInsert;

export type UserStreakMilestone = typeof userStreakMilestones.$inferSelect;
export type NewUserStreakMilestone = typeof userStreakMilestones.$inferInsert;
