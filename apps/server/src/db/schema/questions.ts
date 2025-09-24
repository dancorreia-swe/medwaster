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

import { user } from "./auth";

export const questionTypeValues = [
  "multiple_choice",
  "true_false",
  "fill_in_the_blank",
  "matching",
] as const;
export const questionTypeEnum = pgEnum("question_type", questionTypeValues);

export const questionDifficultyValues = ["basic", "intermediate", "advanced"] as const;
export const questionDifficultyEnum = pgEnum(
  "question_difficulty",
  questionDifficultyValues,
);

export const questionStatusValues = ["draft", "active", "inactive", "archived"] as const;
export const questionStatusEnum = pgEnum("question_status", questionStatusValues);

export const contentCategoryTypeValues = [
  "wiki",
  "question",
  "track",
  "quiz",
  "general",
] as const;
export const contentCategoryTypeEnum = pgEnum(
  "content_category_type",
  contentCategoryTypeValues,
);

export const contentCategories = pgTable(
  "content_categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    color: text("color"),
    parentId: integer("parent_id"),
    type: contentCategoryTypeEnum("type").notNull().default("wiki"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameIdx: index("content_categories_name_idx").on(table.name),
    typeIdx: index("content_categories_type_idx").on(table.type),
  }),
);

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    prompt: text("prompt").notNull(),
    explanation: text("explanation"),
    type: questionTypeEnum("type").notNull(),
    difficulty: questionDifficultyEnum("difficulty").notNull(),
    status: questionStatusEnum("status").notNull().default("draft"),
    categoryId: integer("category_id").references(() => contentCategories.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    imageUrl: text("image_url"),
    references: text("references"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    typeIdx: index("questions_type_idx").on(table.type),
    difficultyIdx: index("questions_difficulty_idx").on(table.difficulty),
    statusIdx: index("questions_status_idx").on(table.status),
    categoryIdx: index("questions_category_idx").on(table.categoryId),
    authorIdx: index("questions_author_idx").on(table.authorId),
    createdAtIdx: index("questions_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("questions_updated_at_idx").on(table.updatedAt),
  }),
);

export const questionsRelations = relations(questions, ({ many, one }) => ({
  author: one(user, {
    fields: [questions.authorId],
    references: [user.id],
  }),
  category: one(contentCategories, {
    fields: [questions.categoryId],
    references: [contentCategories.id],
  }),
  options: many(questionOptions),
  fillInBlanks: many(questionFillBlankAnswers),
  matchingPairs: many(questionMatchingPairs),
  tags: many(questionTags),
}));

export const questionOptions = pgTable(
  "question_options",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    content: text("content").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    questionIdx: index("question_options_question_idx").on(table.questionId),
  }),
);

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
}));

export const questionFillBlankAnswers = pgTable(
  "question_fill_blank_answers",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    placeholder: text("placeholder"),
    answer: text("answer").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    questionSeqIdx: index("question_fill_blank_sequence_idx").on(
      table.questionId,
      table.sequence,
    ),
  }),
);

export const questionFillBlankAnswersRelations = relations(
  questionFillBlankAnswers,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionFillBlankAnswers.questionId],
      references: [questions.id],
    }),
  }),
);

export const questionMatchingPairs = pgTable(
  "question_matching_pairs",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    leftText: text("left_text").notNull(),
    rightText: text("right_text").notNull(),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    questionSequenceIdx: index("question_matching_sequence_idx").on(
      table.questionId,
      table.sequence,
    ),
  }),
);

export const questionMatchingPairsRelations = relations(
  questionMatchingPairs,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionMatchingPairs.questionId],
      references: [questions.id],
    }),
  }),
);

export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameIdx: index("tags_name_idx").on(table.name),
  }),
);

export const tagsRelations = relations(tags, ({ many }) => ({
  questionTags: many(questionTags),
}));

export const questionTags = pgTable(
  "question_tags",
  {
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
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
  (table) => ({
    pk: primaryKey({
      columns: [table.questionId, table.tagId],
      name: "question_tags_pk",
    }),
  }),
);

export const contentCategoriesRelations = relations(contentCategories, ({ many }) => ({
  questions: many(questions),
}));

export const questionTagsRelations = relations(questionTags, ({ one }) => ({
  question: one(questions, {
    fields: [questionTags.questionId],
    references: [questions.id],
  }),
  tag: one(tags, {
    fields: [questionTags.tagId],
    references: [tags.id],
  }),
  assignedByUser: one(user, {
    fields: [questionTags.assignedBy],
    references: [user.id],
  }),
}));
