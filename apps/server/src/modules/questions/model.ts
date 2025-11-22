import { t } from "elysia";

const questionOptionSchema = t.Object({
  label: t.String({ minLength: 1 }),
  content: t.String({ minLength: 1 }),
  isCorrect: t.Boolean(),
});

const fillBlankAnswerSchema = t.Object({
  sequence: t.Number({ minimum: 0 }),
  placeholder: t.Optional(t.String()),
  answer: t.Optional(t.String({ minLength: 1 })),
  options: t.Optional(
    t.Array(
      t.Object({
        text: t.String({ minLength: 1 }),
        isCorrect: t.Boolean(),
      }),
    ),
  ),
});

const matchingPairSchema = t.Object({
  leftText: t.String({ minLength: 1 }),
  rightText: t.String({ minLength: 1 }),
  sequence: t.Number({ minimum: 0 }),
});

const referenceSchema = t.Object({
  title: t.String({ minLength: 1 }),
  url: t.Optional(t.String()),
  type: t.Union([
    t.Literal("book"),
    t.Literal("article"),
    t.Literal("website"),
    t.Literal("other"),
  ]),
});

export const createQuestionBody = t.Object({
  prompt: t.String({ minLength: 1 }),
  explanation: t.Optional(t.String()),
  type: t.Union([
    t.Literal("multiple_choice"),
    t.Literal("true_false"),
    t.Literal("fill_in_the_blank"),
    t.Literal("matching"),
  ]),
  difficulty: t.Union([
    t.Literal("basic"),
    t.Literal("intermediate"),
    t.Literal("advanced"),
  ]),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("active"),
      t.Literal("inactive"),
      t.Literal("archived"),
    ]),
  ),
  categoryId: t.Optional(t.Nullable(t.Number())),
  imageUrl: t.Optional(t.String()),
  imageKey: t.Optional(t.String()),
  references: t.Optional(t.Array(referenceSchema)),
  options: t.Optional(t.Array(questionOptionSchema)),
  fillInBlanks: t.Optional(t.Array(fillBlankAnswerSchema)),
  matchingPairs: t.Optional(t.Array(matchingPairSchema)),
  tagIds: t.Optional(t.Array(t.Number())),
});
export type CreateQuestionBody = typeof createQuestionBody.static;

export const updateQuestionBody = t.Object({
  prompt: t.Optional(t.String({ minLength: 1 })),
  explanation: t.Optional(t.String()),
  type: t.Optional(
    t.Union([
      t.Literal("multiple_choice"),
      t.Literal("true_false"),
      t.Literal("fill_in_the_blank"),
      t.Literal("matching"),
    ]),
  ),
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
      t.Literal("active"),
      t.Literal("inactive"),
      t.Literal("archived"),
    ]),
  ),
  categoryId: t.Optional(t.Nullable(t.Number())),
  imageUrl: t.Optional(t.String()),
  imageKey: t.Optional(t.String()),
  references: t.Optional(t.Array(referenceSchema)),
  options: t.Optional(t.Array(questionOptionSchema)),
  fillInBlanks: t.Optional(t.Array(fillBlankAnswerSchema)),
  matchingPairs: t.Optional(t.Array(matchingPairSchema)),
  tagIds: t.Optional(t.Array(t.Number())),
});
export type UpdateQuestionBody = typeof updateQuestionBody.static;
