import { db } from "@/db";
import { userAchievements } from "@/db/schema/achievements";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

/**
 * Service to track achievement notification delivery
 */
export class AchievementNotificationService {
  /**
   * Get achievements that were unlocked but NOT yet notified to user
   */
  static async getUnnotifiedAchievements(userId: string) {
    const unnotified = await db.query.userAchievements.findMany({
      where: and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.isUnlocked, true),
        isNull(userAchievements.notifiedAt)
      ),
      with: {
        achievement: true,
      },
      orderBy: (ua, { asc }) => [asc(ua.unlockedAt)],
    });

    return unnotified;
  }

  /**
   * Mark an achievement as notified (notification shown to user)
   */
  static async markAsNotified(userId: string, achievementId: number) {
    await db
      .update(userAchievements)
      .set({
        notifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );

    console.log(`✅ Marked achievement ${achievementId} as notified for user ${userId}`);
  }

  /**
   * Mark an achievement as viewed (user opened achievements screen)
   */
  static async markAsViewed(userId: string, achievementId: number) {
    await db
      .update(userAchievements)
      .set({
        viewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
  }

  /**
   * Mark an achievement as claimed (rewards collected)
   */
  static async markAsClaimed(userId: string, achievementId: number) {
    await db
      .update(userAchievements)
      .set({
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
  }

  /**
   * Get notification stats for reporting
   */
  static async getNotificationStats(userId: string) {
    const allUnlocked = await db.query.userAchievements.findMany({
      where: and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.isUnlocked, true)
      ),
    });

    const notified = allUnlocked.filter(ua => ua.notifiedAt !== null);
    const viewed = allUnlocked.filter(ua => ua.viewedAt !== null);
    const claimed = allUnlocked.filter(ua => ua.claimedAt !== null);

    return {
      totalUnlocked: allUnlocked.length,
      notified: notified.length,
      notNotified: allUnlocked.length - notified.length,
      viewed: viewed.length,
      claimed: claimed.length,
      notificationRate: allUnlocked.length > 0 
        ? (notified.length / allUnlocked.length) * 100 
        : 0,
    };
  }
}
