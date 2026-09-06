import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDb,
  mockSubmitQuizAttempt,
  mockGetQuizAttemptResults,
  mockRecordActivity,
} = vi.hoisted(() => ({
  mockDb: {
    query: {
      trails: { findFirst: vi.fn() },
      userTrailProgress: { findFirst: vi.fn() },
      trailContent: { findFirst: vi.fn() },
      quizAttempts: { findFirst: vi.fn() },
      userContentProgress: { findFirst: vi.fn() },
    },
    update: vi.fn(),
    insert: vi.fn(),
  },
  mockSubmitQuizAttempt: vi.fn(),
  mockGetQuizAttemptResults: vi.fn(),
  mockRecordActivity: vi.fn().mockResolvedValue(undefined),
}));

// Vitest's runtime supports virtual mocks for the server's unresolved @ alias.
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
vi.mock("@/db", () => ({ db: mockDb }), { virtual: true });
vi.mock("@/db/schema/trails", () => ({
  trails: { id: "trails.id" },
  trailContent: { id: "trailContent.id", trailId: "trailContent.trailId" },
  trailPrerequisites: {},
  userTrailProgress: { userId: "userTrailProgress.userId", trailId: "userTrailProgress.trailId" },
  userContentProgress: { id: "userContentProgress.id", userId: "userContentProgress.userId", trailContentId: "userContentProgress.trailContentId" },
  userQuestionAttempts: {},
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
}), { virtual: true });
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
vi.mock("@/db/schema/questions", () => ({ questions: {}, questionOptions: {} }), { virtual: true });
vi.mock("@/db/schema/quizzes", () => ({
  quizzes: {},
  quizAttempts: { id: "quizAttempts.id", userId: "quizAttempts.userId" },
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
}), { virtual: true });
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
vi.mock("@/db/schema/wiki", () => ({ wikiArticles: {}, userArticleReads: {} }), { virtual: true });
vi.mock("@/lib/errors", () => ({
  NotFoundError: class NotFoundError extends Error {},
  BusinessLogicError: class BusinessLogicError extends Error {},
  BadRequestError: class BadRequestError extends Error {},
// @ts-expect-error The installed Vitest type declarations omit the virtual option.
}), { virtual: true });
vi.mock("../../../modules/quizzes/quizzes.service", () => ({
  QuizzesService: {
    submitQuizAttempt: mockSubmitQuizAttempt,
    getQuizAttemptResults: mockGetQuizAttemptResults,
  },
}));
vi.mock("../../../modules/gamification/daily-activities.service", () => ({
  DailyActivitiesService: { recordActivity: mockRecordActivity },
}));
vi.mock("../../../modules/certificates/certificates.service", () => ({ CertificateService: {} }));
vi.mock("../../../modules/config/config.service", () => ({ ConfigService: {} }));
vi.mock("../../../modules/achievements/trackers", () => ({
  trackTrailCompleted: vi.fn(),
  trackArticleRead: vi.fn(),
  trackQuestionAnswered: vi.fn(),
}));
vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  asc: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
  isNull: vi.fn(),
  sql: vi.fn(),
}));

import { ProgressService } from "../../../modules/trails/progress.service";

type ExistingProgress = {
  id: number;
  isCompleted: boolean;
  score: number | null;
  attempts: number;
  timeSpentMinutes: number;
  completedAt: Date | null;
};

const content = { id: 10, trailId: 20, quizId: 30, questionId: null, articleId: null };
const attempt = { id: 40, userId: "user-1", trailContentId: 10 };

function setup(existingProgress?: ExistingProgress) {
  const trailProgress = {
    isEnrolled: true,
    isCompleted: false,
  };

  mockDb.query.userTrailProgress.findFirst.mockResolvedValue(trailProgress);
  mockDb.query.trails.findFirst.mockResolvedValue(undefined);
  mockDb.query.trailContent.findFirst.mockResolvedValue(content);
  mockDb.query.quizAttempts.findFirst.mockResolvedValue(attempt);
  mockDb.query.userContentProgress.findFirst.mockResolvedValue(existingProgress);
  mockDb.update.mockReturnValue({
    set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  });
  mockDb.insert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  mockSubmitQuizAttempt.mockResolvedValue({ score: 70, timeSpent: 121 });
  mockGetQuizAttemptResults.mockResolvedValue({
    quiz: { passingScore: 70 },
    answers: [],
  });
  vi.spyOn(ProgressService, "markContentComplete").mockResolvedValue(undefined);
}

async function submit() {
  return ProgressService.submitQuizInTrail("user-1", 20, 10, 40, {
    answers: [],
    timeSpent: 999,
  });
}

describe("ProgressService.submitQuizInTrail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  it("uses the quiz threshold and keeps a failing retry incomplete", async () => {
    mockSubmitQuizAttempt.mockResolvedValue({ score: 79, timeSpent: 1 });
    mockGetQuizAttemptResults.mockResolvedValue({ quiz: { passingScore: 80 }, answers: [] });

    await submit();

    expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
    expect(mockDb.insert.mock.results[0]?.value.values).toHaveBeenCalledWith(
      expect.objectContaining({ isCompleted: false }),
    );
    expect(ProgressService.markContentComplete).not.toHaveBeenCalled();
  });

  it("completes content when the attempt meets the quiz threshold", async () => {
    mockSubmitQuizAttempt.mockResolvedValue({ score: 80, timeSpent: 1 });
    mockGetQuizAttemptResults.mockResolvedValue({ quiz: { passingScore: 80 }, answers: [] });

    await submit();

    expect(mockDb.insert.mock.results[0]?.value.values).toHaveBeenCalledWith(
      expect.objectContaining({ isCompleted: true }),
    );
    expect(ProgressService.markContentComplete).toHaveBeenCalledWith("user-1", 20, 10);
  });

  it("converts attempt seconds to rounded-up minutes for an update", async () => {
    const existingProgress = {
      id: 50,
      isCompleted: false,
      score: null,
      attempts: 2,
      timeSpentMinutes: 4,
      completedAt: null,
    };
    setup(existingProgress);
    mockSubmitQuizAttempt.mockResolvedValue({ score: 10, timeSpent: 121 });

    await submit();

    expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
    expect(mockDb.update.mock.results[0]?.value.set).toHaveBeenCalledWith(
      expect.objectContaining({ attempts: 3, timeSpentMinutes: 7 }),
    );
    expect(mockDb.update.mock.results[0]?.value.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ timeSpent: expect.anything() }),
    );
  });

  it("stores rounded-up attempt minutes on insert", async () => {
    mockSubmitQuizAttempt.mockResolvedValue({ score: 10, timeSpent: 61 });

    await submit();

    expect(mockDb.insert.mock.results[0]?.value.values).toHaveBeenCalledWith(
      expect.objectContaining({ attempts: 1, timeSpentMinutes: 2 }),
    );
  });

  it("retains a zero configured pass threshold", async () => {
    mockSubmitQuizAttempt.mockResolvedValue({ score: 0, timeSpent: 0 });
    mockGetQuizAttemptResults.mockResolvedValue({ quiz: { passingScore: 0 }, answers: [] });

    await submit();

    expect(ProgressService.markContentComplete).toHaveBeenCalledWith("user-1", 20, 10);
  });

  it("keeps content completed after a failing retry", async () => {
    const existingProgress = {
      id: 50,
      isCompleted: true,
      score: 10,
      attempts: 1,
      timeSpentMinutes: 3,
      completedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    setup(existingProgress);
    mockSubmitQuizAttempt.mockResolvedValue({ score: 10, timeSpent: 60 });

    await submit();

    expect(mockDb.update.mock.results[0]?.value.set).toHaveBeenCalledWith(
      expect.objectContaining({ isCompleted: true, timeSpentMinutes: 4 }),
    );
    expect(ProgressService.markContentComplete).toHaveBeenCalledWith("user-1", 20, 10);
  });

  it("preserves a passing score when a later retry fails", async () => {
    mockSubmitQuizAttempt.mockResolvedValue({ score: 85, timeSpent: 60 });
    mockGetQuizAttemptResults.mockResolvedValue({ quiz: { passingScore: 80 }, answers: [] });

    await submit();
    expect(mockDb.insert.mock.results[0]?.value.values).toHaveBeenCalledWith(
      expect.objectContaining({ score: 85, isCompleted: true }),
    );

    vi.clearAllMocks();
    setup({
      id: 50,
      isCompleted: true,
      score: 85,
      attempts: 1,
      timeSpentMinutes: 1,
      completedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    mockSubmitQuizAttempt.mockResolvedValue({ score: 10, timeSpent: 60 });

    const retryResult = await submit();

    expect(retryResult.score).toBe(10);
    expect(mockDb.update.mock.results[0]?.value.set).toHaveBeenCalledWith(
      expect.objectContaining({ score: 85, isCompleted: true }),
    );
  });
});
