import { db } from "@/db";
import {
  certificateUnlockRequirementValues,
  systemConfig,
  type SystemConfig,
} from "@/db/schema/system-config";
import { ConflictError } from "@/lib/errors";
import { and, eq, sql } from "drizzle-orm";
import {
  DEFAULT_CERTIFICATE_DESIGN,
  DEFAULT_CERTIFICATE_TITLE,
  normalizeCertificateDesign,
  type CertificateDesign,
} from "../certificates/design/catalog";

type CertificateUnlockRequirement =
  (typeof certificateUnlockRequirementValues)[number];

export interface AppConfig {
  autoApproveCertificates: boolean;
  certificateTitle: string;
  certificateUnlockRequirement: CertificateUnlockRequirement;
  certificateMinStudyHours: number;
  certificateMaxStudyHours: number;
  certificateDesign: CertificateDesign;
}

export interface CertificateDesignConfig extends AppConfig {
  revision: number;
}

const SYSTEM_CONFIG_SINGLETON_KEY = 1;

const DEFAULT_CONFIG: AppConfig = {
  autoApproveCertificates: false,
  certificateTitle: DEFAULT_CERTIFICATE_TITLE,
  certificateUnlockRequirement: "trails",
  certificateMinStudyHours: 0,
  certificateMaxStudyHours: 0,
  certificateDesign: DEFAULT_CERTIFICATE_DESIGN,
};

function toAppConfig(row: SystemConfig): AppConfig {
  return {
    autoApproveCertificates: row.autoApproveCertificates,
    certificateTitle: row.certificateTitle,
    certificateUnlockRequirement: row.certificateUnlockRequirement,
    certificateMinStudyHours: row.certificateMinStudyHours,
    certificateMaxStudyHours: row.certificateMaxStudyHours,
    certificateDesign: normalizeCertificateDesign(row.certificateDesign),
  };
}

function toCertificateDesignConfig(row: SystemConfig): CertificateDesignConfig {
  return {
    ...toAppConfig(row),
    revision: row.certificateDesignRevision,
  };
}

export abstract class ConfigService {
  private static async getConfigRow(): Promise<SystemConfig> {
    const [existing] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.singletonKey, SYSTEM_CONFIG_SINGLETON_KEY))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(systemConfig)
      .values({ singletonKey: SYSTEM_CONFIG_SINGLETON_KEY })
      .onConflictDoNothing({ target: systemConfig.singletonKey })
      .returning();

    if (created) {
      return created;
    }

    const [afterConflict] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.singletonKey, SYSTEM_CONFIG_SINGLETON_KEY))
      .limit(1);

    if (!afterConflict) {
      throw new Error("System configuration could not be created or read");
    }

    return afterConflict;
  }

  /**
   * Ensure there is always a single config row and return config.
   */
  static async getConfig(): Promise<AppConfig> {
    return toAppConfig(await this.getConfigRow());
  }

  /**
   * Return the saved Certificate Design and its optimistic concurrency revision.
   */
  static async getCertificateDesign(): Promise<CertificateDesignConfig> {
    return toCertificateDesignConfig(await this.getConfigRow());
  }

  /**
   * Update global configuration.
   */
  static async updateConfig(data: Partial<AppConfig>): Promise<AppConfig> {
    await this.getConfigRow();

    const changedValues: Partial<typeof systemConfig.$inferInsert> = {};
    if (data.autoApproveCertificates !== undefined) {
      changedValues.autoApproveCertificates = data.autoApproveCertificates;
    }
    if (data.certificateTitle !== undefined) {
      changedValues.certificateTitle =
        data.certificateTitle.trim() || DEFAULT_CONFIG.certificateTitle;
    }
    if (data.certificateUnlockRequirement !== undefined) {
      changedValues.certificateUnlockRequirement =
        data.certificateUnlockRequirement;
    }
    if (data.certificateMinStudyHours !== undefined) {
      changedValues.certificateMinStudyHours = Math.max(
        0,
        Math.round(data.certificateMinStudyHours),
      );
    }
    if (data.certificateMaxStudyHours !== undefined) {
      changedValues.certificateMaxStudyHours = Math.max(
        0,
        Math.round(data.certificateMaxStudyHours),
      );
    }
    if (data.certificateDesign !== undefined) {
      changedValues.certificateDesign = normalizeCertificateDesign(
        data.certificateDesign,
      );
    }

    const shouldAdvanceDesignRevision =
      data.certificateTitle !== undefined || data.certificateDesign !== undefined;

    const [updated] = await db
      .update(systemConfig)
      .set({
        ...changedValues,
        ...(shouldAdvanceDesignRevision
          ? {
              certificateDesignRevision: sql`${systemConfig.certificateDesignRevision} + 1`,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(systemConfig.singletonKey, SYSTEM_CONFIG_SINGLETON_KEY))
      .returning();

    if (!updated) {
      throw new Error("System configuration could not be updated");
    }

    return toAppConfig(updated);
  }

  /**
   * Save the Certificate Design and its title. Applies to certificates
   * rendered from now on; already-issued PDFs are not touched.
   */
  static async updateCertificateDesign(input: {
    title: string;
    design: CertificateDesign;
    expectedRevision: number;
  }): Promise<CertificateDesignConfig> {
    await this.getConfigRow();

    const [updated] = await db
      .update(systemConfig)
      .set({
        certificateTitle:
          input.title.trim() || DEFAULT_CONFIG.certificateTitle,
        certificateDesign: normalizeCertificateDesign(input.design),
        certificateDesignRevision: sql`${systemConfig.certificateDesignRevision} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(systemConfig.singletonKey, SYSTEM_CONFIG_SINGLETON_KEY),
          eq(systemConfig.certificateDesignRevision, input.expectedRevision),
        ),
      )
      .returning();

    if (!updated) {
      const current = toCertificateDesignConfig(await this.getConfigRow());

      throw new ConflictError(
        "Certificate Design revision conflict; reload the current design before saving",
        {
          reason: "CERTIFICATE_DESIGN_VERSION_CONFLICT",
          expectedRevision: input.expectedRevision,
          current: {
            title: current.certificateTitle,
            design: current.certificateDesign,
            revision: current.revision,
          },
        },
      );
    }

    return toCertificateDesignConfig(updated);
  }
}
