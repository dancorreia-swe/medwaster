import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { contentCategories } from "./categories";
import { questions } from "./questions";
import { quizzes, quizQuestions } from "./quizzes";
import { wikiArticles } from "./wiki";

export const trailDifficultyValues = [
  "basic",
  "intermediate",
  "advanced",
] as const;
export const trailDifficultyEnum = pgEnum(
  "trail_difficulty",
  trailDifficultyValues,
);

export const trailStatusValues = [
  "draft",
  "published",
  "inactive",
  "archived",
] as const;
export const trailStatusEnum = pgEnum("trail_status", trailStatusValues);

export const trails = pgTable(
  "trails",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").notNull().defaultRandom().unique(),
    trailId: text("trail_id").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),

    categoryId: integer("category_id").references(() => contentCategories.id, {
      onDelete: "set null",
    }),
    difficulty: trailDifficultyEnum("difficulty").notNull(),
    status: trailStatusEnum("status").notNull().default("draft"),

    unlockOrder: integer("unlock_order"),

    passPercentage: real("pass_percentage").notNull().default(70),
    attemptsAllowed: integer("attempts_allowed"),
    timeLimitMinutes: integer("time_limit_minutes"),
    allowSkipQuestions: boolean("allow_skip_questions")
      .notNull()
      .default(false),
    showImmediateExplanations: boolean("show_immediate_explanations")
      .notNull()
      .default(true),

    randomizeContentOrder: boolean("randomize_content_order")
      .notNull()
      .default(false),
    coverImageUrl: text("cover_image_url"),
    coverImageKey: text("cover_image_key"),
    themeColor: text("theme_color"),

    availableFrom: timestamp("available_from", { withTimezone: true }),
    availableUntil: timestamp("available_until", { withTimezone: true }),
    estimatedTimeMinutes: integer("estimated_time_minutes"),
    customCertificate: boolean("custom_certificate").notNull().default(false),

    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    enrolledCount: integer("enrolled_count").notNull().default(0),
    completionRate: real("completion_rate").notNull().default(0),
    averageCompletionMinutes: integer("average_completion_minutes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("trails_status_idx").on(table.status),
    index("trails_difficulty_idx").on(table.difficulty),
    index("trails_category_idx").on(table.categoryId),
    index("trails_author_idx").on(table.authorId),
    index("trails_unlock_order_idx").on(table.unlockOrder),
    index("trails_created_at_idx").on(table.createdAt),
    index("trails_updated_at_idx").on(table.updatedAt),
    index("trails_trail_id_idx").on(table.trailId),
  ],
);

export const trailsRelations = relations(trails, ({ one, many }) => ({
  author: one(user, {
    fields: [trails.authorId],
    references: [user.id],
  }),
  category: one(contentCategories, {
    fields: [trails.categoryId],
    references: [contentCategories.id],
  }),
  prerequisites: many(trailPrerequisites, { relationName: "trail" }),
  unlockedBy: many(trailPrerequisites, { relationName: "prerequisite" }),
  content: many(trailContent),
  userProgress: many(userTrailProgress),
}));

export const trailPrerequisites = pgTable(
  "trail_prerequisites",
  {
    trailId: integer("trail_id")
      .notNull()
      .references(() => trails.id, { onDelete: "cascade" }),
    prerequisiteTrailId: integer("prerequisite_trail_id")
      .notNull()
      .references(() => trails.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.trailId, table.prerequisiteTrailId],
      name: "trail_prerequisites_pk",
    }),
    index("trail_prerequisites_trail_idx").on(table.trailId),
    index("trail_prerequisites_prerequisite_idx").on(table.prerequisiteTrailId),
  ],
);

export const trailPrerequisitesRelations = relations(
  trailPrerequisites,
  ({ one }) => ({
    trail: one(trails, {
      fields: [trailPrerequisites.trailId],
      references: [trails.id],
      relationName: "trail",
    }),
    prerequisiteTrail: one(trails, {
      fields: [trailPrerequisites.prerequisiteTrailId],
      references: [trails.id],
      relationName: "prerequisite",
    }),
  }),
);

export const trailContent = pgTable(
  "trail_content",
  {
    id: serial("id").primaryKey(),
    trailId: integer("trail_id")
      .notNull()
      .references(() => trails.id, { onDelete: "cascade" }),

    questionId: integer("question_id").references(() => questions.id, {
      onDelete: "cascade",
    }),
    quizId: integer("quiz_id").references(() => quizzes.id, {
      onDelete: "cascade",
    }),
    articleId: integer("article_id").references(() => wikiArticles.id, {
      onDelete: "cascade",
    }),

    sequence: integer("sequence").notNull(),
    isRequired: boolean("is_required").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("trail_content_trail_idx").on(table.trailId),
    index("trail_content_sequence_idx").on(table.trailId, table.sequence),
    index("trail_content_question_idx").on(table.questionId),
    index("trail_content_quiz_idx").on(table.quizId),
    index("trail_content_article_idx").on(table.articleId),
    check(
      "trail_content_type_check",
      sql`(
        (${table.questionId} IS NOT NULL)::int + 
        (${table.quizId} IS NOT NULL)::int + 
        (${table.articleId} IS NOT NULL)::int
      ) = 1`,
    ),
  ],
);

export const trailContentRelations = relations(trailContent, ({ one }) => ({
  trail: one(trails, {
    fields: [trailContent.trailId],
    references: [trails.id],
  }),
  question: one(questions, {
    fields: [trailContent.questionId],
    references: [questions.id],
  }),
  quiz: one(quizzes, {
    fields: [trailContent.quizId],
    references: [quizzes.id],
  }),
  article: one(wikiArticles, {
    fields: [trailContent.articleId],
    references: [wikiArticles.id],
  }),
}));


export const userTrailProgress = pgTable(
  "user_trail_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trailId: integer("trail_id")
      .notNull()
      .references(() => trails.id, { onDelete: "cascade" }),

    isUnlocked: boolean("is_unlocked").notNull().default(false),
    isEnrolled: boolean("is_enrolled").notNull().default(false),

    currentContentId: integer("current_content_id"),
    completedContentIds: text("completed_content_ids").notNull().default("[]"),

    attempts: integer("attempts").notNull().default(0),
    bestScore: real("best_score"),
    currentScore: real("current_score"),

    isCompleted: boolean("is_completed").notNull().default(false),
    isPassed: boolean("is_passed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),
    currentAttemptStartedAt: timestamp("current_attempt_started_at", {
      withTimezone: true,
    }),

    enrolledAt: timestamp("enrolled_at", { withTimezone: true }),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_trail_progress_user_idx").on(table.userId),
    index("user_trail_progress_trail_idx").on(table.trailId),
    index("user_trail_progress_user_trail_idx").on(table.userId, table.trailId),
    index("user_trail_progress_completed_idx").on(
      table.isCompleted,
      table.isPassed,
    ),
  ],
);

export const userTrailProgressRelations = relations(
  userTrailProgress,
  ({ one }) => ({
    user: one(user, {
      fields: [userTrailProgress.userId],
      references: [user.id],
    }),
    trail: one(trails, {
      fields: [userTrailProgress.trailId],
      references: [trails.id],
    }),
  }),
);

export const userContentProgress = pgTable(
  "user_content_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trailContentId: integer("trail_content_id")
      .notNull()
      .references(() => trailContent.id, { onDelete: "cascade" }),

    isCompleted: boolean("is_completed").notNull().default(false),
    score: real("score"),
    timeSpentMinutes: integer("time_spent_minutes").notNull().default(0),

    attempts: integer("attempts").notNull().default(0),

    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_content_progress_user_idx").on(table.userId),
    index("user_content_progress_content_idx").on(table.trailContentId),
    index("user_content_progress_user_content_idx").on(
      table.userId,
      table.trailContentId,
    ),
  ],
);

export const userContentProgressRelations = relations(
  userContentProgress,
  ({ one }) => ({
    user: one(user, {
      fields: [userContentProgress.userId],
      references: [user.id],
    }),
    trailContent: one(trailContent, {
      fields: [userContentProgress.trailContentId],
      references: [trailContent.id],
    }),
  }),
);

export const userQuizAttempts = pgTable(
  "user_quiz_attempts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    quizId: integer("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    trailContentId: integer("trail_content_id").references(
      () => trailContent.id,
      {
        onDelete: "set null",
      },
    ),

    score: real("score").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    correctAnswers: integer("correct_answers").notNull(),

    timeSpentMinutes: integer("time_spent_minutes").notNull(),

    answers: text("answers").notNull(),

    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_quiz_attempts_user_idx").on(table.userId),
    index("user_quiz_attempts_quiz_idx").on(table.quizId),
    index("user_quiz_attempts_user_quiz_idx").on(table.userId, table.quizId),
    index("user_quiz_attempts_completed_idx").on(table.completedAt),
  ],
);

export const userQuizAttemptsRelations = relations(
  userQuizAttempts,
  ({ one }) => ({
    user: one(user, {
      fields: [userQuizAttempts.userId],
      references: [user.id],
    }),
    quiz: one(quizzes, {
      fields: [userQuizAttempts.quizId],
      references: [quizzes.id],
    }),
    trailContent: one(trailContent, {
      fields: [userQuizAttempts.trailContentId],
      references: [trailContent.id],
    }),
  }),
);

export const userQuestionAttempts = pgTable(
  "user_question_attempts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    trailContentId: integer("trail_content_id").references(
      () => trailContent.id,
      {
        onDelete: "set null",
      },
    ),
    quizAttemptId: integer("quiz_attempt_id").references(
      () => userQuizAttempts.id,
      {
        onDelete: "set null",
      },
    ),

    isCorrect: boolean("is_correct").notNull(),
    userAnswer: text("user_answer").notNull(),
    timeSpentSeconds: integer("time_spent_seconds").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_question_attempts_user_idx").on(table.userId),
    index("user_question_attempts_question_idx").on(table.questionId),
    index("user_question_attempts_trail_content_idx").on(table.trailContentId),
    index("user_question_attempts_quiz_attempt_idx").on(table.quizAttemptId),
  ],
);

export const userQuestionAttemptsRelations = relations(
  userQuestionAttempts,
  ({ one }) => ({
    user: one(user, {
      fields: [userQuestionAttempts.userId],
      references: [user.id],
    }),
    question: one(questions, {
      fields: [userQuestionAttempts.questionId],
      references: [questions.id],
    }),
    trailContent: one(trailContent, {
      fields: [userQuestionAttempts.trailContentId],
      references: [trailContent.id],
    }),
    quizAttempt: one(userQuizAttempts, {
      fields: [userQuestionAttempts.quizAttemptId],
      references: [userQuizAttempts.id],
    }),
  }),
);

export type Trail = typeof trails.$inferSelect;
export type NewTrail = typeof trails.$inferInsert;
export type TrailDifficulty = (typeof trailDifficultyValues)[number];
export type TrailStatus = (typeof trailStatusValues)[number];

export type TrailPrerequisite = typeof trailPrerequisites.$inferSelect;
export type NewTrailPrerequisite = typeof trailPrerequisites.$inferInsert;

export type TrailContent = typeof trailContent.$inferSelect;
export type NewTrailContent = typeof trailContent.$inferInsert;

export type TrailContentType = "question" | "quiz" | "article";

export const getTrailContentType = (content: TrailContent): TrailContentType => {
  if (content.questionId !== null) return "question";
  if (content.quizId !== null) return "quiz";
  if (content.articleId !== null) return "article";
  throw new Error("Invalid trail content: no content type set");
};


export type UserTrailProgress = typeof userTrailProgress.$inferSelect;
export type NewUserTrailProgress = typeof userTrailProgress.$inferInsert;

export type UserContentProgress = typeof userContentProgress.$inferSelect;
export type NewUserContentProgress = typeof userContentProgress.$inferInsert;

export type UserQuizAttempt = typeof userQuizAttempts.$inferSelect;
export type NewUserQuizAttempt = typeof userQuizAttempts.$inferInsert;

export type UserQuestionAttempt = typeof userQuestionAttempts.$inferSelect;
export type NewUserQuestionAttempt = typeof userQuestionAttempts.$inferInsert;
