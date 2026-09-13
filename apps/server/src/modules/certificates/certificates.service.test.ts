import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  getConfig: vi.fn(),
  generateCertificatePDF: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      certificates: {
        findFirst: mocks.findFirst,
      },
    },
  },
}));

vi.mock("@/db/schema/certificates", () => ({
  certificates: { id: {}, userId: {}, createdAt: {} },
}));

vi.mock("@/db/schema/trails", () => ({
  trails: { status: {} },
  userTrailProgress: {
    trailId: {},
    userId: {},
    isCompleted: {},
    isPassed: {},
    bestScore: {},
    timeSpentMinutes: {},
    completedAt: {},
  },
}));

vi.mock("@/db/schema/wiki", () => ({
  userArticleReads: {
    articleId: {},
    userId: {},
    isRead: {},
    readPercentage: {},
    timeSpentSeconds: {},
    markedReadAt: {},
    lastReadAt: {},
  },
  wikiArticles: { status: {}, id: {} },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  avg: vi.fn(),
  count: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  sql: vi.fn(),
  sum: vi.fn(),
}));

vi.mock("@/lib/errors", () => ({
  BadRequestError: class BadRequestError extends Error {
    statusCode = 400;
    constructor(message: string) {
      super(message);
      this.name = "BadRequestError";
    }
  },
  BusinessLogicError: class BusinessLogicError extends Error {},
  ForbiddenError: class ForbiddenError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
}));

vi.mock("../config/config.service", () => ({
  ConfigService: { getConfig: mocks.getConfig },
}));

vi.mock("./pdf-generator", () => ({
  generateCertificatePDF: mocks.generateCertificatePDF,
}));

vi.mock("../achievements/trackers", () => ({
  trackCertificateEarned: vi.fn(),
}));

import { CertificateService } from "./certificates.service";

const legacyUserCertificate = {
  id: 123,
  userId: "student-1",
  status: "pending",
  averageScore: 90,
  totalTrailsCompleted: 10,
  totalTimeMinutes: 100,
  allTrailsCompletedAt: new Date("2024-01-01T00:00:00.000Z"),
  verificationCode: "CERT-2024-TEST",
  reviewedBy: null,
  user: { name: "אדם", image: null },
};

describe("certificate issuance name preflight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConfig.mockResolvedValue({});
    mocks.findFirst.mockResolvedValue(legacyUserCertificate);
  });

  it("returns BadRequest guidance instead of rendering during manual approval", async () => {
    await expect(
      CertificateService.approveCertificate(123, "reviewer-1"),
    ).rejects.toEqual(
      expect.objectContaining({
        name: "BadRequestError",
        statusCode: 400,
        message: expect.stringContaining("Atualize o nome do estudante"),
      }),
    );
    expect(mocks.generateCertificatePDF).not.toHaveBeenCalled();
  });

  it("returns BadRequest guidance instead of rendering during regeneration", async () => {
    mocks.findFirst.mockResolvedValue({
      ...legacyUserCertificate,
      status: "approved",
    });

    const rejection = CertificateService.regenerateCertificateForUser(
      "student-1",
      "reviewer-1",
    );
    await expect(rejection).rejects.toMatchObject({
      name: "BadRequestError",
      statusCode: 400,
      message: expect.stringContaining("Atualize o nome do estudante"),
    });
    expect(mocks.generateCertificatePDF).not.toHaveBeenCalled();
  });
});
