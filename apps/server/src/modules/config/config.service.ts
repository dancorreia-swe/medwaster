import { db } from "@/db";
import {
  certificateUnlockRequirementValues,
  systemConfig,
  type SystemConfig,
} from "@/db/schema/system-config";
import { eq } from "drizzle-orm";
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

function toRowValues(config: AppConfig) {
  return {
    autoApproveCertificates: config.autoApproveCertificates,
    certificateTitle: config.certificateTitle,
    certificateUnlockRequirement: config.certificateUnlockRequirement,
    certificateMinStudyHours: config.certificateMinStudyHours,
    certificateMaxStudyHours: config.certificateMaxStudyHours,
    certificateDesign: config.certificateDesign,
  };
}

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

      return toAppConfig(created);
    }

    return toAppConfig(existing);
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
    newValues.certificateDesign = normalizeCertificateDesign(
      newValues.certificateDesign,
    );

    const existing = await db.query.systemConfig.findFirst();

    if (existing) {
      // Write only the fields this call changed, so a PATCH from the settings
      // panel and a PUT from the design page can't revert each other.
      const changedValues = Object.fromEntries(
        Object.entries(toRowValues(newValues)).filter(([key]) => key in data),
      ) as Partial<ReturnType<typeof toRowValues>>;

      await db
        .update(systemConfig)
        .set({
          ...changedValues,
          updatedAt: new Date(),
        })
        .where(eq(systemConfig.id, existing.id));
    } else {
      await db.insert(systemConfig).values(toRowValues(newValues));
    }

    return newValues;
  }

  /**
   * Save the Certificate Design and its title. Applies to certificates
   * rendered from now on; already-issued PDFs are not touched.
   */
  static async updateCertificateDesign(input: {
    title: string;
    design: CertificateDesign;
  }): Promise<AppConfig> {
    return this.updateConfig({
      certificateTitle: input.title,
      certificateDesign: normalizeCertificateDesign(input.design),
    });
  }
}
