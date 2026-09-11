import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb, mockTx } = vi.hoisted(() => {
  const tx = {
    delete: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };

  return {
    mockDb: {
      select: vi.fn(),
      transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    },
    mockTx: tx,
  };
});

vi.mock("@/db", () => ({ db: mockDb }),
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("@/db/schema/questions", () => ({
  questions: { id: "questions.id" },
  questionOptions: { questionId: "questionOptions.questionId" },
  questionFillBlankAnswers: { questionId: "questionFillBlankAnswers.questionId" },
  questionFillBlankOptions: {},
  questionMatchingPairs: { questionId: "questionMatchingPairs.questionId" },
  questionTags: { questionId: "questionTags.questionId" },
  tags: {},
}),
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("@/db/schema/quizzes", () => ({ quizQuestions: {} }),
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("@/db/schema/trails", () => ({ trailContent: {} }),
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("@/lib/errors", () => ({
  DependencyError: class DependencyError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
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
vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  asc: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  ilike: vi.fn(),
  inArray: vi.fn(),
  or: vi.fn(),
  sql: vi.fn(),
}),
  // @ts-ignore The installed Vitest type declarations omit the virtual option.
  { virtual: true });
vi.mock("../../../modules/questions/s3-storage.service", () => ({
  S3StorageService: { deleteImage: vi.fn() },
}));

import { QuestionsService } from "../../../modules/questions/questions.service";

function mockExistingQuestion(
  type: "multiple_choice" | "true_false" | "fill_in_the_blank" | "matching",
) {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: 1, type, status: "active" }]),
      }),
    }),
  });
}

describe("QuestionsService.updateQuestion content integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const requiredVariationsToClear: Array<[
    "multiple_choice" | "true_false" | "fill_in_the_blank" | "matching",
    Parameters<typeof QuestionsService.updateQuestion>[1],
  ]> = [
    ["multiple_choice", { options: [] }],
    ["true_false", { options: [] }],
    ["fill_in_the_blank", { fillInBlanks: [] }],
    ["matching", { matchingPairs: [] }],
  ];

  it.each(requiredVariationsToClear)(
    "rejects clearing required %s variations when type is omitted",
    async (type, patch) => {
      mockExistingQuestion(type);

      await expect(QuestionsService.updateQuestion(1, patch)).rejects.toMatchObject({
        name: "ValidationError",
        statusCode: 400,
      });

      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockTx.delete).not.toHaveBeenCalled();
    },
  );

  it("allows an update that leaves the required variation unchanged", async () => {
    mockExistingQuestion("multiple_choice");
    mockTx.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
    });

    await expect(
      QuestionsService.updateQuestion(1, { prompt: "Updated prompt" }),
    ).resolves.toEqual({ id: 1 });
  });
});

describe("QuestionsService.createQuestion native-rendering contract", () => {
  const baseQuestion = {
    prompt: "Prompt",
    difficulty: "basic" as const,
    status: "active" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["multiple choice without a correct option", {
      ...baseQuestion,
      type: "multiple_choice" as const,
      options: [
        { label: "A", content: "One", isCorrect: false },
        { label: "B", content: "Two", isCorrect: false },
      ],
    }],
    ["true/false with only one option", {
      ...baseQuestion,
      type: "true_false" as const,
      options: [{ label: "Verdadeiro", content: "Verdadeiro", isCorrect: true }],
    }],
    ["fill in the blank without selectable answers", {
      ...baseQuestion,
      type: "fill_in_the_blank" as const,
      fillInBlanks: [{ sequence: 1, placeholder: "answer", options: [] }],
    }],
  ])("rejects %s before opening a transaction", async (_description, question) => {
    await expect(QuestionsService.createQuestion(question, "author")).rejects.toMatchObject({
      name: "ValidationError",
      statusCode: 400,
    });

    expect(mockDb.transaction).not.toHaveBeenCalled();
  });
});
