import { db } from "@/db";
import {
  certificateUnlockRequirementValues,
  systemConfig,
} from "@/db/schema/system-config";
import { eq } from "drizzle-orm";

type CertificateUnlockRequirement =
  (typeof certificateUnlockRequirementValues)[number];

export interface AppConfig {
  autoApproveCertificates: boolean;
  certificateTitle: string;
  certificateUnlockRequirement: CertificateUnlockRequirement;
  certificateMinStudyHours: number;
  certificateMaxStudyHours: number;
}

const DEFAULT_CONFIG: AppConfig = {
  autoApproveCertificates: false,
  certificateTitle: "Conclusão de Trilhas",
  certificateUnlockRequirement: "trails",
  certificateMinStudyHours: 0,
  certificateMaxStudyHours: 0,
};

export abstract class ConfigService {
  /**
   * Ensure there is always a single config row and return config.
   */
  static async getConfig(): Promise<AppConfig> {
    const existing = await db.query.systemConfig.findFirst();

    if (!existing) {
      const [created] = await db
        .insert(systemConfig)
        .values({})
        .returning();

      return {
        autoApproveCertificates: created.autoApproveCertificates,
        certificateTitle: created.certificateTitle,
        certificateUnlockRequirement: created.certificateUnlockRequirement,
        certificateMinStudyHours: created.certificateMinStudyHours,
        certificateMaxStudyHours: created.certificateMaxStudyHours,
      };
    }

    return {
      autoApproveCertificates: existing.autoApproveCertificates,
      certificateTitle: existing.certificateTitle,
      certificateUnlockRequirement: existing.certificateUnlockRequirement,
      certificateMinStudyHours: existing.certificateMinStudyHours,
      certificateMaxStudyHours: existing.certificateMaxStudyHours,
    };
  }

  /**
   * Update global configuration.
   */
  static async updateConfig(data: Partial<AppConfig>): Promise<AppConfig> {
    const current = await this.getConfig();
    const newValues: AppConfig = {
      ...current,
      ...data,
    };

    newValues.certificateTitle =
      newValues.certificateTitle.trim() || DEFAULT_CONFIG.certificateTitle;
    newValues.certificateMinStudyHours = Math.max(
      0,
      Math.round(newValues.certificateMinStudyHours),
    );
    newValues.certificateMaxStudyHours = Math.max(
      0,
      Math.round(newValues.certificateMaxStudyHours),
    );

    const existing = await db.query.systemConfig.findFirst();

    if (existing) {
      await db
        .update(systemConfig)
        .set({
          autoApproveCertificates: newValues.autoApproveCertificates,
          certificateTitle: newValues.certificateTitle,
          certificateUnlockRequirement: newValues.certificateUnlockRequirement,
          certificateMinStudyHours: newValues.certificateMinStudyHours,
          certificateMaxStudyHours: newValues.certificateMaxStudyHours,
          updatedAt: new Date(),
        })
        .where(eq(systemConfig.id, existing.id));
    } else {
      await db.insert(systemConfig).values({
        autoApproveCertificates: newValues.autoApproveCertificates,
        certificateTitle: newValues.certificateTitle,
        certificateUnlockRequirement: newValues.certificateUnlockRequirement,
        certificateMinStudyHours: newValues.certificateMinStudyHours,
        certificateMaxStudyHours: newValues.certificateMaxStudyHours,
      });
    }

    return newValues;
  }
}
