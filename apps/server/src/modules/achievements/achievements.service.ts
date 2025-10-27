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

  static async createAchievement(newAchievement: CreateAchievementBody) {
    if (await this.isNameTaken(newAchievement.name)) {
      throw new ConflictError("Achievement name is already taken");
    }

    const [achievement] = await db
      .insert(achievements)
      .values(newAchievement)
      .returning();

    return achievement;
  }

  static async updateAchievement(
    achievementId: number,
    data: UpdateAchievementBody,
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

    const [achievement] = await db
      .update(achievements)
      .set({ ...data, updatedAt: new Date() })
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
