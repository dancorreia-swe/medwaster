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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-typebox";

import { user } from "./auth";
import { contentCategories } from "./categories";
import { questions, tags } from "./questions";
import { trailContent } from "./trails";

export const quizStatusValues = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;
export const quizStatusEnum = pgEnum("quiz_status", quizStatusValues);
export type QuizStatus = (typeof quizStatusValues)[number];

export const quizDifficultyValues = [
  "basic",
  "intermediate", 
  "advanced",
  "mixed",
] as const;
export const quizDifficultyEnum = pgEnum("quiz_difficulty", quizDifficultyValues);
export type QuizDifficulty = (typeof quizDifficultyValues)[number];

export const quizzes = pgTable(
  "quizzes",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    instructions: text("instructions"),
    difficulty: quizDifficultyEnum("difficulty").notNull(),
    status: quizStatusEnum("status").notNull().default("draft"),
    categoryId: integer("category_id").references(() => contentCategories.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    timeLimit: integer("time_limit"), // in minutes
    maxAttempts: integer("max_attempts").default(3),
    showResults: boolean("show_results").notNull().default(true),
    showCorrectAnswers: boolean("show_correct_answers").notNull().default(true),
    randomizeQuestions: boolean("randomize_questions").notNull().default(false),
    randomizeOptions: boolean("randomize_options").notNull().default(false),
    passingScore: integer("passing_score").default(70), // percentage
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("quizzes_status_id_idx").on(table.status),
    index("quizzes_difficulty_id_idx").on(table.difficulty),
    index("quizzes_category_id_idx").on(table.categoryId),
    index("quizzes_author_id_idx").on(table.authorId),
    index("quizzes_created_at_ts_idx").on(table.createdAt),
  ],
);

export const quizzesRelations = relations(quizzes, ({ many, one }) => ({
  author: one(user, {
    fields: [quizzes.authorId],
    references: [user.id],
  }),
  category: one(contentCategories, {
    fields: [quizzes.categoryId],
    references: [contentCategories.id],
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
  tags: many(quizTags),
}));

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    points: integer("points").notNull().default(1),
    required: boolean("required").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("quiz_questions_quiz_id_idx").on(table.quizId),
    index("quiz_questions_question_id_idx").on(table.questionId),
    index("quiz_questions_quiz_order_idx").on(table.quizId, table.order),
  ],
);

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  question: one(questions, {
    fields: [quizQuestions.questionId],
    references: [questions.id],
  }),
}));

export const quizAttemptStatusValues = [
  "in_progress",
  "completed",
  "submitted",
  "timed_out",
  "abandoned",
] as const;
export const quizAttemptStatusEnum = pgEnum("quiz_attempt_status", quizAttemptStatusValues);
export type QuizAttemptStatus = (typeof quizAttemptStatusValues)[number];

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trailContentId: integer("trail_content_id").references(
      () => trailContent.id,
      { onDelete: "set null" },
    ),
    status: quizAttemptStatusEnum("status").notNull().default("in_progress"),
    score: integer("score"), // percentage
    totalPoints: integer("total_points"),
    earnedPoints: integer("earned_points"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    timeSpent: integer("time_spent"), // in seconds
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("quiz_attempts_quiz_id_idx").on(table.quizId),
    index("quiz_attempts_user_id_idx").on(table.userId),
    index("quiz_attempts_status_id_idx").on(table.status),
    index("quiz_attempts_started_at_idx").on(table.startedAt),
    index("quiz_attempts_trail_content_id_idx").on(table.trailContentId),
  ],
);

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  user: one(user, {
    fields: [quizAttempts.userId],
    references: [user.id],
  }),
  answers: many(quizAnswers),
}));

export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    quizQuestionId: integer("quiz_question_id")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    selectedOptions: text("selected_options"), // JSON array of option IDs
    textAnswer: text("text_answer"), // for fill-in-blank
    matchingAnswers: text("matching_answers"), // JSON for matching questions
    isCorrect: boolean("is_correct"),
    pointsEarned: integer("points_earned").default(0),
    timeSpent: integer("time_spent"), // in seconds
    answeredAt: timestamp("answered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("quiz_answers_attempt_id_idx").on(table.attemptId),
    index("quiz_answers_question_id_idx").on(table.questionId),
    index("quiz_answers_quiz_question_id_idx").on(table.quizQuestionId),
  ],
);

export const quizAnswersRelations = relations(quizAnswers, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizAnswers.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(questions, {
    fields: [quizAnswers.questionId],
    references: [questions.id],
  }),
  quizQuestion: one(quizQuestions, {
    fields: [quizAnswers.quizQuestionId],
    references: [quizQuestions.id],
  }),
}));

export const quizTags = pgTable(
  "quiz_tags",
  {
    quizId: integer("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.quizId, table.tagId],
      name: "quiz_tags_pk",
    }),
    index("quiz_tags_quiz_idx").on(table.quizId),
    index("quiz_tags_tag_idx").on(table.tagId),
  ],
);

export const quizTagsRelations = relations(quizTags, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizTags.quizId],
    references: [quizzes.id],
  }),
  tag: one(tags, {
    fields: [quizTags.tagId],
    references: [tags.id],
  }),
  assignedByUser: one(user, {
    fields: [quizTags.assignedBy],
    references: [user.id],
  }),
}));

export const quizInsertSchema = createInsertSchema(quizzes);
export const quizQuestionInsertSchema = createInsertSchema(quizQuestions);
export const quizAttemptInsertSchema = createInsertSchema(quizAttempts);
export const quizAnswerInsertSchema = createInsertSchema(quizAnswers);

export type Quiz = typeof quizzes.$inferSelect;
export type QuizInsert = typeof quizzes.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizQuestionInsert = typeof quizQuestions.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type QuizAttemptInsert = typeof quizAttempts.$inferInsert;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type QuizAnswerInsert = typeof quizAnswers.$inferInsert;