import { db } from "@/db";
import { systemConfig } from "@/db/schema/system-config";
import { eq } from "drizzle-orm";

export interface AppConfig {
  autoApproveCertificates: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  autoApproveCertificates: false,
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
      };
    }

    return {
      autoApproveCertificates: existing.autoApproveCertificates,
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

    const existing = await db.query.systemConfig.findFirst();

    if (existing) {
      await db
        .update(systemConfig)
        .set({
          autoApproveCertificates: newValues.autoApproveCertificates,
          updatedAt: new Date(),
        })
        .where(eq(systemConfig.id, existing.id));
    } else {
      await db.insert(systemConfig).values({
        autoApproveCertificates: newValues.autoApproveCertificates,
      });
    }

    return newValues;
  }
}
