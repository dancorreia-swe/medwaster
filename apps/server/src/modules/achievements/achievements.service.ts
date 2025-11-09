import { db } from "@/db";
import type { CreateAchievementBody, UpdateAchievementBody } from "./model";
import { achievements } from "@/db/schema/achievements";
import { asc, eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/lib/errors";

export abstract class AchievementsService {
  static async isNameTaken(name: string, excludeId?: number) {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.name, name))
      .limit(1);

    if (achievement && excludeId && achievement.id === excludeId) {
      return false;
    }

    return !!achievement;
  }

  static async getAchievementById(achievementId: number) {
    const achievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, achievementId),
      with: {
        createdByUser: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!achievement) {
      throw new NotFoundError("Achievement");
    }

    return achievement;
  }

  static async createAchievement(newAchievement: CreateAchievementBody, createdBy: string) {
    if (await this.isNameTaken(newAchievement.name)) {
      throw new ConflictError("Achievement name is already taken");
    }

    // Generate slug from name
    const slug = newAchievement.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Map difficulty from frontend to database enum
    const difficultyMap: Record<string, string> = {
      easy: "bronze",
      medium: "silver",
      hard: "gold",
    };
    const difficulty = difficultyMap[newAchievement.difficulty || "medium"] || "silver";

    // Transform badge fields into nested object
    const badge = {
      type: newAchievement.badgeImageUrl ? "image" : "icon",
      value: newAchievement.badgeImageUrl || newAchievement.badgeIcon || "trophy",
      color: newAchievement.badgeColor || "#fbbf24",
    };

    // Transform trigger fields into nested config
    const triggerConfig: any = {
      type: newAchievement.triggerType || "manual",
      conditions: {},
    };

    if (newAchievement.targetCount) {
      triggerConfig.conditions.count = newAchievement.targetCount;
    }
    if (newAchievement.targetResourceId) {
      triggerConfig.conditions.resourceId = newAchievement.targetResourceId;
    }
    if (newAchievement.targetAccuracy) {
      triggerConfig.conditions.accuracyPercentage = newAchievement.targetAccuracy;
    }
    if (newAchievement.targetTimeSeconds) {
      triggerConfig.conditions.timeSeconds = newAchievement.targetTimeSeconds;
    }
    if (newAchievement.targetStreakDays) {
      triggerConfig.conditions.streakDays = newAchievement.targetStreakDays;
    }
    if (newAchievement.requirePerfectScore !== undefined) {
      triggerConfig.conditions.perfectScore = newAchievement.requirePerfectScore;
    }
    if (newAchievement.requireSequential !== undefined) {
      triggerConfig.conditions.sequential = newAchievement.requireSequential;
    }

    // Map visibility
    const visibility = newAchievement.isSecret ? "secret" : "public";

    const [achievement] = await db
      .insert(achievements)
      .values({
        slug,
        name: newAchievement.name,
        description: newAchievement.description,
        category: newAchievement.category,
        difficulty: difficulty as any,
        status: newAchievement.status || "draft",
        visibility: visibility as any,
        badge,
        triggerConfig,
        displayOrder: newAchievement.displayOrder || 0,
        createdBy,
      })
      .returning();

    return achievement;
  }

  static async updateAchievement(
    achievementId: number,
    data: UpdateAchievementBody,
    updatedBy?: string,
  ) {
    const [existing] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, achievementId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Achievement");
    }

    if (
      data.name &&
      data.name !== existing.name &&
      (await this.isNameTaken(data.name, achievementId))
    ) {
      throw new ConflictError("Achievement name is already taken");
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    // Only update fields that are provided
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.category) updateData.category = data.category;
    if (data.status) updateData.status = data.status;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;

    // Map difficulty from frontend to database enum if provided
    if (data.difficulty) {
      const difficultyMap: Record<string, string> = {
        easy: "bronze",
        medium: "silver",
        hard: "gold",
      };
      updateData.difficulty = difficultyMap[data.difficulty] || "silver";
    }

    // Update badge if any badge fields are provided
    if (
      data.badgeIcon ||
      data.badgeColor ||
      data.badgeImageUrl !== undefined
    ) {
      const currentBadge = existing.badge as any || {};
      updateData.badge = {
        type: data.badgeImageUrl ? "image" : (data.badgeIcon ? "icon" : currentBadge.type || "icon"),
        value: data.badgeImageUrl || data.badgeIcon || currentBadge.value || "trophy",
        color: data.badgeColor || currentBadge.color || "#fbbf24",
      };
    }

    // Update trigger config if any trigger fields are provided
    if (
      data.triggerType ||
      data.targetCount !== undefined ||
      data.targetResourceId ||
      data.targetAccuracy !== undefined ||
      data.targetTimeSeconds !== undefined ||
      data.targetStreakDays !== undefined ||
      data.requirePerfectScore !== undefined ||
      data.requireSequential !== undefined
    ) {
      const currentConfig = existing.triggerConfig as any || { conditions: {} };
      const triggerConfig: any = {
        type: data.triggerType || currentConfig.type || "manual",
        conditions: { ...currentConfig.conditions },
      };

      if (data.targetCount !== undefined) {
        triggerConfig.conditions.count = data.targetCount;
      }
      if (data.targetResourceId !== undefined) {
        triggerConfig.conditions.resourceId = data.targetResourceId;
      }
      if (data.targetAccuracy !== undefined) {
        triggerConfig.conditions.accuracyPercentage = data.targetAccuracy;
      }
      if (data.targetTimeSeconds !== undefined) {
        triggerConfig.conditions.timeSeconds = data.targetTimeSeconds;
      }
      if (data.targetStreakDays !== undefined) {
        triggerConfig.conditions.streakDays = data.targetStreakDays;
      }
      if (data.requirePerfectScore !== undefined) {
        triggerConfig.conditions.perfectScore = data.requirePerfectScore;
      }
      if (data.requireSequential !== undefined) {
        triggerConfig.conditions.sequential = data.requireSequential;
      }

      updateData.triggerConfig = triggerConfig;
    }

    // Map visibility
    if (data.isSecret !== undefined) {
      updateData.visibility = data.isSecret ? "secret" : "public";
    }

    const [achievement] = await db
      .update(achievements)
      .set(updateData)
      .where(eq(achievements.id, achievementId))
      .returning();

    return achievement;
  }

  static async getAllAchievements({ page = 1, pageSize = 50 } = {}) {
    const allAchievements = await db.query.achievements.findMany({
      with: {
        createdByUser: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [asc(achievements.displayOrder), asc(achievements.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return allAchievements;
  }

  static async deleteAchievement(achievementId: number) {
    const [existing] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, achievementId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Achievement");
    }

    await db.delete(achievements).where(eq(achievements.id, achievementId));

    return existing;
  }
}
