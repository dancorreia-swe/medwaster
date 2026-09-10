import { Value } from "@sinclair/typebox/value";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "@/db/schema/quizzes",
  () => ({
    quizStatusValues: ["draft", "active", "inactive", "archived"],
    quizDifficultyValues: ["basic", "intermediate", "advanced", "mixed"],
  }),
  // @ts-expect-error The installed Vitest type declarations omit the virtual option.
  { virtual: true },
);

import { createQuizBody, updateQuizBody } from "./model";

const createQuiz = {
  title: "Quiz de teste",
  difficulty: "basic",
} as const;

describe("quiz request validation", () => {
  it("accepts explicit nulls used to clear nullable quiz fields", () => {
    const body = {
      ...createQuiz,
      categoryId: null,
      timeLimit: null,
      imageUrl: null,
    };

    expect(Value.Check(createQuizBody, body)).toBe(true);
    expect(Value.Check(updateQuizBody, body)).toBe(true);
  });

  it("keeps zero as the backwards-compatible unlimited time limit", () => {
    expect(
      Value.Check(createQuizBody, { ...createQuiz, timeLimit: 0 }),
    ).toBe(true);
    expect(Value.Check(updateQuizBody, { timeLimit: 0 })).toBe(true);
  });

  it("still rejects invalid time limits and unrelated field types", () => {
    expect(
      Value.Check(createQuizBody, { ...createQuiz, timeLimit: -1 }),
    ).toBe(false);
    expect(
      Value.Check(updateQuizBody, { categoryId: "not-a-number" }),
    ).toBe(false);
  });
});
