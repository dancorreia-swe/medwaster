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

      await expect(QuestionsService.updateQuestion(1, patch)).rejects.toThrow(
        /requires/i,
      );

      expect(mockDb.transaction).not.toHaveBeenCalled();
      expect(mockTx.delete).not.toHaveBeenCalled();
    },
  );
});
