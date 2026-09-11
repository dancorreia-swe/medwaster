import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/errors", () => ({
  ValidationError: class ValidationError extends Error {
    statusCode = 400;

    constructor(message: string) {
      super(message);
      this.name = "ValidationError";
    }
  },
}),
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });

import { validateQuestionData } from "../../../modules/questions/question-content.validator";

const option = (content: string, isCorrect: boolean) => ({
  label: content.slice(0, 1).toUpperCase(),
  content,
  isCorrect,
});

const rejects = (body: Parameters<typeof validateQuestionData>[0]) =>
  expect(() => validateQuestionData(body)).toThrowError(
    expect.objectContaining({ name: "ValidationError" }),
  );

const base = {
  prompt: "Prompt",
  difficulty: "basic",
} as const;

describe("validateQuestionData — true_false", () => {
  it("rejects a single option", () => {
    rejects({
      ...base,
      type: "true_false",
      options: [option("Verdadeiro", true)],
    } as any);
  });

  it("rejects more than two options", () => {
    rejects({
      ...base,
      type: "true_false",
      options: [
        option("Verdadeiro", true),
        option("Falso", false),
        option("Talvez", false),
      ],
    } as any);
  });

  it("rejects when no option is correct", () => {
    rejects({
      ...base,
      type: "true_false",
      options: [option("Verdadeiro", false), option("Falso", false)],
    } as any);
  });

  it("rejects when both options are correct", () => {
    rejects({
      ...base,
      type: "true_false",
      options: [option("Verdadeiro", true), option("Falso", true)],
    } as any);
  });

  it("accepts exactly two options with one correct", () => {
    expect(() =>
      validateQuestionData({
        ...base,
        type: "true_false",
        options: [option("Verdadeiro", true), option("Falso", false)],
      } as any),
    ).not.toThrow();
  });
});

describe("validateQuestionData — multiple_choice", () => {
  it("rejects zero correct options", () => {
    rejects({
      ...base,
      type: "multiple_choice",
      options: [option("Aorta", false), option("Veia Cava", false)],
    } as any);
  });

  it("rejects a single option", () => {
    rejects({
      ...base,
      type: "multiple_choice",
      options: [option("Aorta", true)],
    } as any);
  });

  it("accepts two or more options with a correct one", () => {
    expect(() =>
      validateQuestionData({
        ...base,
        type: "multiple_choice",
        options: [option("Aorta", true), option("Veia Cava", false)],
      } as any),
    ).not.toThrow();
  });
});

describe("validateQuestionData — fill_in_the_blank", () => {
  it("rejects a blank with neither an answer nor a correct option", () => {
    rejects({
      ...base,
      type: "fill_in_the_blank",
      fillInBlanks: [
        { sequence: 1, options: [{ text: "coração", isCorrect: false }] },
      ],
    } as any);
  });

  it("rejects a blank with no answer and no options at all", () => {
    rejects({
      ...base,
      type: "fill_in_the_blank",
      fillInBlanks: [{ sequence: 1 }],
    } as any);
  });

  it("accepts a blank carrying only a canonical answer", () => {
    expect(() =>
      validateQuestionData({
        ...base,
        type: "fill_in_the_blank",
        fillInBlanks: [{ sequence: 1, answer: "coração" }],
      } as any),
    ).not.toThrow();
  });

  it("accepts a blank whose options include a correct one", () => {
    expect(() =>
      validateQuestionData({
        ...base,
        type: "fill_in_the_blank",
        fillInBlanks: [
          {
            sequence: 1,
            options: [
              { text: "coração", isCorrect: true },
              { text: "fígado", isCorrect: false },
            ],
          },
        ],
      } as any),
    ).not.toThrow();
  });
});

describe("validateQuestionData — patches", () => {
  it("still rejects clearing a required variation", () => {
    expect(() =>
      validateQuestionData({ options: [] } as any, "multiple_choice"),
    ).toThrowError(expect.objectContaining({ name: "ValidationError" }));
  });

  it("leaves an untouched variation alone", () => {
    expect(() =>
      validateQuestionData({ prompt: "Updated" } as any, "true_false"),
    ).not.toThrow();
  });

  it("validates a variation the patch supplies, using the persisted type", () => {
    expect(() =>
      validateQuestionData(
        { options: [option("Verdadeiro", true)] } as any,
        "true_false",
      ),
    ).toThrowError(expect.objectContaining({ name: "ValidationError" }));
  });
});
