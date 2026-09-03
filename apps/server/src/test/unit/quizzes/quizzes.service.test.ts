import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb, mockTx, mockTrackQuizCompleted } = vi.hoisted(() => {
  const tx = {
    insert: vi.fn(),
    update: vi.fn(),
  };

  const db = {
    query: {
      quizAttempts: {
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    ),
    update: vi.fn(),
    insert: vi.fn(),
  };

  return {
    mockDb: db,
    mockTx: tx,
    mockTrackQuizCompleted: vi.fn(),
  };
});

// @ts-expect-error The installed Vitest type declarations omit the virtual option.
vi.mock("@/db", () => ({ db: mockDb }), { virtual: true });
vi.mock("@/db/schema/quizzes", () => ({
  quizzes: {},
  quizQuestions: {},
  quizAttempts: { id: "quizAttempts.id", userId: "quizAttempts.userId" },
  quizAnswers: {},
  quizTags: {},
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
}), { virtual: true });
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
vi.mock("@/db/schema/trails", () => ({ trailContent: {} }), { virtual: true });
vi.mock("@/lib/errors", () => ({
  BadRequestError: class BadRequestError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
  DependencyError: class DependencyError extends Error {},
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
}), { virtual: true });
vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  asc: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  ne: vi.fn(),
  sql: vi.fn(),
  ilike: vi.fn(),
  or: vi.fn(),
  inArray: vi.fn(),
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
}), { virtual: true });
vi.mock("../../../modules/achievements/trackers", () => ({
  trackQuizCompleted: mockTrackQuizCompleted,
}));

import { QuizzesService } from "../../../modules/quizzes/quizzes.service";

const quizQuestions = [
  {
    id: 101,
    questionId: 201,
    points: 10,
    required: true,
    question: {
      type: "multiple_choice",
      options: [{ id: 301, isCorrect: true }],
      fillInBlanks: [],
      matchingPairs: [],
    },
  },
  {
    id: 102,
    questionId: 202,
    points: 20,
    required: true,
    question: {
      type: "true_false",
      options: [{ id: 302, isCorrect: true }],
      fillInBlanks: [],
      matchingPairs: [],
    },
  },
  {
    id: 103,
    questionId: 203,
    points: 30,
    required: true,
    question: {
      type: "fill_in_the_blank",
      options: [],
      fillInBlanks: [
        {
          id: 401,
          options: [{ id: 402, text: "correct", isCorrect: true }],
        },
      ],
      matchingPairs: [],
    },
  },
  {
    id: 104,
    questionId: 204,
    points: 40,
    required: true,
    question: {
      type: "matching",
      options: [],
      fillInBlanks: [],
      matchingPairs: [{ leftText: "left", rightText: "right" }],
    },
  },
];

const answers = [
  { quizQuestionId: 101, selectedOptions: [301] },
  { quizQuestionId: 102, selectedOptions: [302] },
  { quizQuestionId: 103, textAnswer: JSON.stringify({ 401: "Correct" }) },
  { quizQuestionId: 104, matchingAnswers: { left: "right" } },
];

const updatedAttempt = {
  id: 1,
  status: "completed",
  score: 100,
  totalPoints: 100,
  earnedPoints: 100,
};

function setupAttempt() {
  mockDb.query.quizAttempts.findFirst.mockResolvedValue({
    id: 1,
    quizId: 10,
    userId: "user-1",
    status: "in_progress",
    startedAt: new Date(),
    quiz: {
      timeLimit: null,
      questions: quizQuestions,
    },
  });

  mockTx.insert.mockImplementation(() => ({
    values: vi.fn().mockResolvedValue(undefined),
  }));
  mockTx.update.mockImplementation(() => ({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updatedAttempt]),
      }),
    }),
  }));
}

describe("QuizzesService.submitQuizAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAttempt();
  });

  it("rejects a submission missing a required quiz question", async () => {
    await expect(
      QuizzesService.submitQuizAttempt(1, "user-1", {
        answers: answers.slice(0, 1),
      }),
    ).rejects.toThrow(/missing answer for required/i);

    expect(mockDb.transaction).not.toHaveBeenCalled();
    expect(mockTx.insert).not.toHaveBeenCalled();
  });

  it("rejects duplicate answers for the same quiz question", async () => {
    await expect(
      QuizzesService.submitQuizAttempt(1, "user-1", {
        answers: [...answers, answers[0]!],
      }),
    ).rejects.toThrow(/duplicate answer/i);

    expect(mockDb.transaction).not.toHaveBeenCalled();
    expect(mockTx.insert).not.toHaveBeenCalled();
  });

  it("grades a complete submission for all supported question types", async () => {
    const result = await QuizzesService.submitQuizAttempt(1, "user-1", {
      answers,
      timeSpent: 120,
    });

    expect(result).toEqual(updatedAttempt);
    expect(mockTx.insert).toHaveBeenCalledTimes(4);
    expect(mockTx.update).toHaveBeenCalledTimes(1);

    const updateSet = mockTx.update.mock.results[0]?.value.set;
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 100,
        totalPoints: 100,
        earnedPoints: 100,
      }),
    );
    expect(mockTrackQuizCompleted).toHaveBeenCalledWith(
      "user-1",
      10,
      100,
      100,
    );
  });
});
