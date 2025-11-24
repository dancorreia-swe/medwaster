import { t } from "elysia";
import { quizStatusValues, quizDifficultyValues } from "@/db/schema/quizzes";

export const quizQuestionBody = t.Object({
  questionId: t.Number(),
  order: t.Number({ minimum: 1 }),
  points: t.Number({ minimum: 1 }),
  required: t.Optional(t.Boolean()),
});

export const createQuizBody = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String()),
  instructions: t.Optional(t.String()),
  difficulty: t.Union(quizDifficultyValues.map((d) => t.Literal(d))),
  status: t.Optional(t.Union(quizStatusValues.map((s) => t.Literal(s)))),
  categoryId: t.Optional(t.Number()),
  timeLimit: t.Optional(t.Number({ minimum: 1 })),
  maxAttempts: t.Optional(t.Number({ minimum: 1 })),
  showResults: t.Optional(t.Boolean()),
  showCorrectAnswers: t.Optional(t.Boolean()),
  randomizeQuestions: t.Optional(t.Boolean()),
  randomizeOptions: t.Optional(t.Boolean()),
  passingScore: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  imageUrl: t.Optional(t.String()),
  questions: t.Optional(t.Array(quizQuestionBody)),
  tagIds: t.Optional(t.Array(t.Number())),
});

export const updateQuizBody = t.Object({
  title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.String()),
  instructions: t.Optional(t.String()),
  difficulty: t.Optional(t.Union(quizDifficultyValues.map((d) => t.Literal(d)))),
  status: t.Optional(t.Union(quizStatusValues.map((s) => t.Literal(s)))),
  categoryId: t.Optional(t.Number()),
  timeLimit: t.Optional(t.Number({ minimum: 1 })),
  maxAttempts: t.Optional(t.Number({ minimum: 1 })),
  showResults: t.Optional(t.Boolean()),
  showCorrectAnswers: t.Optional(t.Boolean()),
  randomizeQuestions: t.Optional(t.Boolean()),
  randomizeOptions: t.Optional(t.Boolean()),
  passingScore: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  imageUrl: t.Optional(t.String()),
  questions: t.Optional(t.Array(quizQuestionBody)),
  tagIds: t.Optional(t.Array(t.Number())),
});

export const startQuizAttemptBody = t.Object({
  ipAddress: t.Optional(t.String()),
  userAgent: t.Optional(t.String()),
});

export const submitQuizAnswerBody = t.Object({
  quizQuestionId: t.Number(),
  selectedOptions: t.Optional(t.Array(t.Number())),
  textAnswer: t.Optional(t.String()),
  matchingAnswers: t.Optional(t.Record(t.String(), t.String())),
  timeSpent: t.Optional(t.Number({ minimum: 0 })),
});

export const submitQuizAttemptBody = t.Object({
  answers: t.Array(submitQuizAnswerBody),
  timeSpent: t.Optional(t.Number({ minimum: 0 })),
});

export type CreateQuizBody = typeof createQuizBody.static;
export type UpdateQuizBody = typeof updateQuizBody.static;
export type QuizQuestionBody = typeof quizQuestionBody.static;
export type StartQuizAttemptBody = typeof startQuizAttemptBody.static;
export type SubmitQuizAnswerBody = typeof submitQuizAnswerBody.static;
export type SubmitQuizAttemptBody = typeof submitQuizAttemptBody.static;