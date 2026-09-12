import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDb,
  mockSelectLimit,
  mockInsertOnConflict,
  mockInsertReturning,
  mockUpdateSet,
  mockUpdateWhere,
  mockUpdateReturning,
  mockSystemConfig,
  mockAnd,
  mockEq,
  mockSql,
  MockConflictError,
} = vi.hoisted(() => {
  const selectLimit = vi.fn();
  const selectWhere = vi.fn(() => ({ limit: selectLimit }));
  const selectFrom = vi.fn(() => ({ where: selectWhere }));

  const insertReturning = vi.fn();
  const insertOnConflict = vi.fn(() => ({ returning: insertReturning }));
  const insertValues = vi.fn(() => ({ onConflictDoNothing: insertOnConflict }));

  const updateReturning = vi.fn();
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));

  const schema = {
    singletonKey: "systemConfig.singletonKey",
    certificateDesignRevision: "systemConfig.certificateDesignRevision",
  };

  class ConflictError extends Error {
    readonly code = "CONFLICT";
    readonly statusCode = 409;
    details?: unknown;

    constructor(message: string, details?: unknown) {
      super(message);
      this.name = "ConflictError";
      this.details = details;
    }
  }

  return {
    mockDb: {
      select: vi.fn(() => ({ from: selectFrom })),
      insert: vi.fn(() => ({ values: insertValues })),
      update: vi.fn(() => ({ set: updateSet })),
    },
    mockSelectLimit: selectLimit,
    mockInsertOnConflict: insertOnConflict,
    mockInsertReturning: insertReturning,
    mockUpdateSet: updateSet,
    mockUpdateWhere: updateWhere,
    mockUpdateReturning: updateReturning,
    mockSystemConfig: schema,
    mockAnd: vi.fn((...conditions: unknown[]) => ({ conditions })),
    mockEq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
    mockSql: vi.fn(() => "REVISION_INCREMENT"),
    MockConflictError: ConflictError,
  };
});

vi.mock("@/db", () => ({ db: mockDb }));
vi.mock(
  "@/db/schema/system-config",
  () => ({
    certificateUnlockRequirementValues: [
      "trails",
      "articles",
      "trails_and_articles",
    ],
    systemConfig: mockSystemConfig,
  }),
);
vi.mock(
  "@/lib/errors",
  () => ({ ConflictError: MockConflictError }),
);
vi.mock(
  "drizzle-orm",
  () => ({ and: mockAnd, eq: mockEq, sql: mockSql }),
);

import { DEFAULT_CERTIFICATE_DESIGN, type CertificateDesign } from "../certificates/design/catalog";
import { ConfigService } from "./config.service";

const savedDesign: CertificateDesign = {
  layout: "classico",
  palette: "vinho",
  elements: {
    studentPhoto: false,
    averageScore: true,
    completedCount: false,
    studyTime: true,
    qrCode: false,
    footerSlogan: true,
  },
};

function configRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    singletonKey: 1,
    autoApproveCertificates: false,
    certificateTitle: "Saved title",
    certificateUnlockRequirement: "trails",
    certificateMinStudyHours: 0,
    certificateMaxStudyHours: 0,
    certificateDesign: DEFAULT_CERTIFICATE_DESIGN,
    certificateDesignRevision: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("ConfigService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([]);
    mockInsertReturning.mockResolvedValue([]);
    mockUpdateReturning.mockResolvedValue([]);
  });

  it("reads the row again after an initialization insert loses a singleton conflict", async () => {
    const persisted = configRow({
      certificateTitle: "Initialized by another request",
      certificateDesign: savedDesign,
      certificateDesignRevision: 7,
    });
    mockSelectLimit
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([persisted]);
    mockInsertReturning.mockResolvedValueOnce([]);

    await expect(ConfigService.getCertificateDesign()).resolves.toEqual({
      autoApproveCertificates: persisted.autoApproveCertificates,
      certificateTitle: persisted.certificateTitle,
      certificateUnlockRequirement: "trails",
      certificateMinStudyHours: persisted.certificateMinStudyHours,
      certificateMaxStudyHours: persisted.certificateMaxStudyHours,
      certificateDesign: persisted.certificateDesign,
      revision: 7,
    });

    expect(mockInsertOnConflict).toHaveBeenCalledWith({
      target: mockSystemConfig.singletonKey,
    });
    expect(mockSelectLimit).toHaveBeenCalledTimes(2);
  });

  it("returns the committed row from updateConfig instead of merging with the old row", async () => {
    const oldRow = configRow({
      autoApproveCertificates: false,
      certificateTitle: "Old title",
      certificateMinStudyHours: 1,
    });
    const committed = configRow({
      autoApproveCertificates: true,
      certificateTitle: "Committed title",
      certificateUnlockRequirement: "articles",
      certificateMinStudyHours: 6,
      certificateMaxStudyHours: 12,
      certificateDesign: savedDesign,
      certificateDesignRevision: 4,
    });
    mockSelectLimit.mockResolvedValueOnce([oldRow]);
    mockUpdateReturning.mockResolvedValueOnce([committed]);

    await expect(
      ConfigService.updateConfig({ certificateTitle: "Requested title" }),
    ).resolves.toEqual({
      autoApproveCertificates: true,
      certificateTitle: "Committed title",
      certificateUnlockRequirement: "articles",
      certificateMinStudyHours: 6,
      certificateMaxStudyHours: 12,
      certificateDesign: savedDesign,
    });
  });

  it("updates the Certificate Design only when the expected revision matches", async () => {
    const current = configRow({ certificateDesignRevision: 4 });
    const committed = configRow({
      certificateTitle: "New certificate title",
      certificateDesign: savedDesign,
      certificateDesignRevision: 5,
    });
    mockSelectLimit.mockResolvedValueOnce([current]);
    mockUpdateReturning.mockResolvedValueOnce([committed]);

    await expect(
      ConfigService.updateCertificateDesign({
        title: "  New certificate title  ",
        design: savedDesign,
        expectedRevision: 4,
      }),
    ).resolves.toMatchObject({
      certificateTitle: "New certificate title",
      certificateDesign: savedDesign,
      revision: 5,
    });

    expect(mockAnd).toHaveBeenCalledWith(
      { column: mockSystemConfig.singletonKey, value: 1 },
      {
        column: mockSystemConfig.certificateDesignRevision,
        value: 4,
      },
    );
    expect(mockUpdateWhere).toHaveBeenCalledWith({
      conditions: [
        { column: mockSystemConfig.singletonKey, value: 1 },
        {
          column: mockSystemConfig.certificateDesignRevision,
          value: 4,
        },
      ],
    });
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        certificateTitle: "New certificate title",
        certificateDesign: savedDesign,
        certificateDesignRevision: "REVISION_INCREMENT",
      }),
    );
  });

  it("throws a 409 with the normalized current design when the expected revision is stale", async () => {
    const current = configRow({
      certificateTitle: "Current certificate title",
      certificateDesign: {
        layout: "removed-layout",
        palette: "removed-palette",
        elements: { studentPhoto: false, qrCode: "invalid" },
      },
      certificateDesignRevision: 9,
    });
    mockSelectLimit
      .mockResolvedValueOnce([current])
      .mockResolvedValueOnce([current]);
    mockUpdateReturning.mockResolvedValueOnce([]);

    const operation = ConfigService.updateCertificateDesign({
      title: "Stale title",
      design: savedDesign,
      expectedRevision: 8,
    });

    await expect(operation).rejects.toBeInstanceOf(MockConflictError);
    await expect(operation).rejects.toMatchObject({
      name: "ConflictError",
      code: "CONFLICT",
      statusCode: 409,
      details: {
        reason: "CERTIFICATE_DESIGN_VERSION_CONFLICT",
        expectedRevision: 8,
        current: {
          title: "Current certificate title",
          design: {
            ...DEFAULT_CERTIFICATE_DESIGN,
            elements: {
              ...DEFAULT_CERTIFICATE_DESIGN.elements,
              studentPhoto: false,
            },
          },
          revision: 9,
        },
      },
    });
  });
});
