import { t } from "elysia";

// Enums matching database schema
export const trailDifficultyValues = ["basic", "intermediate", "advanced"] as const;
export const trailStatusValues = ["draft", "published", "inactive", "archived"] as const;

// Content type for polymorphic trailContent
export const contentTypeValues = ["question", "quiz", "article"] as const;

// Create Trail Request Body
export const createTrailBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String()),
  categoryId: t.Optional(t.Nullable(t.Number())),
  difficulty: t.Union([
    t.Literal("basic"),
    t.Literal("intermediate"),
    t.Literal("advanced"),
  ]),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("published"),
      t.Literal("inactive"),
      t.Literal("archived"),
    ]),
  ),
  unlockOrder: t.Optional(t.Nullable(t.Number())),
  passPercentage: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  attemptsAllowed: t.Optional(t.Number({ minimum: 1 })),
  timeLimitMinutes: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
  allowSkipQuestions: t.Optional(t.Boolean()),
  showImmediateExplanations: t.Optional(t.Boolean()),
  randomizeContentOrder: t.Optional(t.Boolean()),
  coverImageUrl: t.Optional(t.Nullable(t.String())),
  themeColor: t.Optional(t.Nullable(t.String())),
  availableFrom: t.Optional(t.Nullable(t.String())), // ISO date string
  availableUntil: t.Optional(t.Nullable(t.String())), // ISO date string
  estimatedTimeMinutes: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
  customCertificate: t.Optional(t.Boolean()),
});

export type CreateTrailBody = typeof createTrailBody.static;

// Update Trail Request Body (all fields optional)
export const updateTrailBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.Nullable(t.String())),
  categoryId: t.Optional(t.Nullable(t.Number())),
  difficulty: t.Optional(
    t.Union([
      t.Literal("basic"),
      t.Literal("intermediate"),
      t.Literal("advanced"),
    ]),
  ),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("published"),
      t.Literal("inactive"),
      t.Literal("archived"),
    ]),
  ),
  unlockOrder: t.Optional(t.Nullable(t.Number())),
  passPercentage: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  attemptsAllowed: t.Optional(t.Number({ minimum: 1 })),
  timeLimitMinutes: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
  allowSkipQuestions: t.Optional(t.Boolean()),
  showImmediateExplanations: t.Optional(t.Boolean()),
  randomizeContentOrder: t.Optional(t.Boolean()),
  coverImageUrl: t.Optional(t.Nullable(t.String())),
  themeColor: t.Optional(t.Nullable(t.String())),
  availableFrom: t.Optional(t.Nullable(t.String())),
  availableUntil: t.Optional(t.Nullable(t.String())),
  estimatedTimeMinutes: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
  customCertificate: t.Optional(t.Boolean()),
});

export type UpdateTrailBody = typeof updateTrailBody.static;

// Add Content to Trail
export const addContentBody = t.Object({
  contentType: t.Union([
    t.Literal("question"),
    t.Literal("quiz"),
    t.Literal("article"),
  ]),
  contentId: t.Number(),
  sequence: t.Number({ minimum: 0 }),
  isRequired: t.Optional(t.Boolean()),
});

export type AddContentBody = typeof addContentBody.static;

// Update Content
export const updateContentBody = t.Object({
  sequence: t.Optional(t.Number({ minimum: 0 })),
  isRequired: t.Optional(t.Boolean()),
});

export type UpdateContentBody = typeof updateContentBody.static;

// Reorder Content
export const reorderContentBody = t.Object({
  contentUpdates: t.Array(
    t.Object({
      contentId: t.Number(),
      sequence: t.Number({ minimum: 0 }),
    }),
  ),
});

export type ReorderContentBody = typeof reorderContentBody.static;

// Add Prerequisite
export const addPrerequisiteBody = t.Object({
  prerequisiteTrailId: t.Number(),
});

export type AddPrerequisiteBody = typeof addPrerequisiteBody.static;

// Submit Question Answer (within trail)
export const submitQuestionAnswerBody = t.Object({
  answer: t.Union([
    t.String(), // For fill-in-blank text answers (legacy)
    t.Number(), // For single option ID
    t.Array(t.Number()), // For multiple option IDs
    t.Record(t.String(), t.String()), // For fill-in-blank with options: { "1": "answer", "2": "answer" }
  ]),
  timeSpentSeconds: t.Optional(t.Number({ minimum: 0 })),
});

export type SubmitQuestionAnswerBody = typeof submitQuestionAnswerBody.static;

// Query params for listing trails
export const listTrailsQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1 })),
  pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("published"),
      t.Literal("inactive"),
      t.Literal("archived"),
    ]),
  ),
  difficulty: t.Optional(
    t.Union([
      t.Literal("basic"),
      t.Literal("intermediate"),
      t.Literal("advanced"),
    ]),
  ),
  categoryId: t.Optional(t.Number()),
  search: t.Optional(t.String()),
});

export type ListTrailsQuery = typeof listTrailsQuery.static;

// Track time spent on content
export const trackTimeBody = t.Object({
  timeSpentMinutes: t.Number({ minimum: 0 }),
});

export type TrackTimeBody = typeof trackTimeBody.static;
