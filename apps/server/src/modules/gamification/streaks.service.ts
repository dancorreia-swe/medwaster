import { db } from "@/db";
import {
  userStreaks,
  userDailyActivities,
  streakMilestones,
  userStreakMilestones,
  type UserStreak,
  type StreakMilestone,
} from "@/db/schema/gamification";
import { eq, and, desc, sql } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";
import type { UserStreakResponse } from "./model";

export class StreaksService {
  /**
   * Get or create user streak record
   */
  static async getUserStreak(userId: string): Promise<UserStreakResponse> {
    let streak = await db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, userId),
    });

    if (!streak) {
      // Create initial streak record for user
      const [newStreak] = await db
        .insert(userStreaks)
        .values({
          userId,
          currentStreak: 0,
          longestStreak: 0,
          totalActiveDays: 0,
          freezesAvailable: 0,
          freezesUsed: 0,
        })
        .returning();
      streak = newStreak;
    }

    // Get next milestone
    const nextMilestone = await this.getNextMilestone(streak.currentStreak);
    const daysUntilNextMilestone = nextMilestone
      ? nextMilestone.days - streak.currentStreak
      : null;

    return {
      ...streak,
      canUseFreeze: streak.freezesAvailable > 0,
      daysUntilNextMilestone,
      nextMilestone,
    };
  }

  /**
   * Update streak based on activity
   * Called when user completes any activity
   */
  static async updateStreakForActivity(
    userId: string,
    activityDate: Date = new Date(),
  ): Promise<UserStreak> {
    const dateStr = this.formatDate(activityDate);
    const today = this.formatDate(new Date());
    const yesterday = this.formatDate(this.getYesterday());

    let streak = await db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, userId),
    });

    if (!streak) {
      streak = await this.getUserStreak(userId);
    }

    const lastActivityDate = streak.lastActivityDate;

    // Check if already counted today
    if (lastActivityDate === dateStr) {
      return streak;
    }

    let newCurrentStreak = streak.currentStreak;
    let newCurrentStreakStartDate = streak.currentStreakStartDate;

    // Determine streak logic
    if (!lastActivityDate) {
      // First activity ever
      newCurrentStreak = 1;
      newCurrentStreakStartDate = dateStr;
    } else if (lastActivityDate === yesterday) {
      // Consecutive day
      newCurrentStreak += 1;
    } else if (lastActivityDate === today) {
      // Already updated today (shouldn't happen due to check above)
      return streak;
    } else {
      // Streak broken - start new streak
      newCurrentStreak = 1;
      newCurrentStreakStartDate = dateStr;
    }

    // Update longest streak if needed
    const newLongestStreak = Math.max(
      streak.longestStreak,
      newCurrentStreak,
    );

    // Update streak record
    const [updatedStreak] = await db
      .update(userStreaks)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: dateStr,
        currentStreakStartDate: newCurrentStreakStartDate,
        totalActiveDays: streak.totalActiveDays + 1,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.userId, userId))
      .returning();

    // Check for milestone achievements
    await this.checkAndAwardMilestones(userId, newCurrentStreak);

    return updatedStreak;
  }

  /**
   * Use a streak freeze to protect streak
   */
  static async useFreeze(
    userId: string,
    freezeDate?: Date,
  ): Promise<UserStreak> {
    const streak = await db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, userId),
    });

    if (!streak) {
      throw new NotFoundError("User streak not found");
    }

    if (streak.freezesAvailable <= 0) {
      throw new Error("No freezes available");
    }

    const dateToFreeze = freezeDate ? this.formatDate(freezeDate) : null;

    // Update daily activity to mark freeze used
    if (dateToFreeze) {
      const activity = await db.query.userDailyActivities.findFirst({
        where: and(
          eq(userDailyActivities.userId, userId),
          eq(userDailyActivities.activityDate, dateToFreeze),
        ),
      });

      if (activity) {
        await db
          .update(userDailyActivities)
          .set({
            freezeUsed: true,
            updatedAt: new Date(),
          })
          .where(eq(userDailyActivities.id, activity.id));
      } else {
        // Create activity record with freeze
        await db.insert(userDailyActivities).values({
          userId,
          activityDate: dateToFreeze,
          freezeUsed: true,
        });
      }
    }

    // Update streak record
    const [updatedStreak] = await db
      .update(userStreaks)
      .set({
        freezesAvailable: streak.freezesAvailable - 1,
        freezesUsed: streak.freezesUsed + 1,
        lastFreezeUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.userId, userId))
      .returning();

    return updatedStreak;
  }

  /**
   * Award freezes (called when user reaches milestone)
   */
  static async awardFreezes(
    userId: string,
    freezeCount: number,
  ): Promise<UserStreak> {
    const [updatedStreak] = await db
      .update(userStreaks)
      .set({
        freezesAvailable: sql`${userStreaks.freezesAvailable} + ${freezeCount}`,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.userId, userId))
      .returning();

    return updatedStreak;
  }

  /**
   * Check if user has missed a day and break streak
   * This should be called by a background job daily
   */
  static async checkAndBreakStreaks(): Promise<void> {
    const yesterday = this.formatDate(this.getYesterday());
    const twoDaysAgo = this.formatDate(
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    );

    // Find all streaks where last activity was 2+ days ago
    const streaksToBreak = await db.query.userStreaks.findMany({
      where: and(
        sql`${userStreaks.currentStreak} > 0`,
        sql`${userStreaks.lastActivityDate} <= ${twoDaysAgo}`,
      ),
    });

    for (const streak of streaksToBreak) {
      // Check if they used a freeze yesterday
      const yesterdayActivity = await db.query.userDailyActivities.findFirst({
        where: and(
          eq(userDailyActivities.userId, streak.userId),
          eq(userDailyActivities.activityDate, yesterday),
        ),
      });

      if (!yesterdayActivity?.freezeUsed) {
        // Break the streak
        await db
          .update(userStreaks)
          .set({
            currentStreak: 0,
            currentStreakStartDate: null,
            updatedAt: new Date(),
          })
          .where(eq(userStreaks.userId, streak.userId));
      }
    }
  }

  /**
   * Get next milestone for current streak
   */
  private static async getNextMilestone(
    currentStreak: number,
  ): Promise<StreakMilestone | null> {
    const milestone = await db.query.streakMilestones.findFirst({
      where: sql`${streakMilestones.days} > ${currentStreak}`,
      orderBy: [streakMilestones.days],
    });

    return milestone || null;
  }

  /**
   * Check and award milestones
   */
  private static async checkAndAwardMilestones(
    userId: string,
    currentStreak: number,
  ): Promise<void> {
    // Get all milestones user has reached but not achieved yet
    const reachedMilestones = await db.query.streakMilestones.findMany({
      where: sql`${streakMilestones.days} <= ${currentStreak}`,
    });

    // Get milestones user already has
    const achievedMilestones = await db.query.userStreakMilestones.findMany({
      where: eq(userStreakMilestones.userId, userId),
    });

    const achievedMilestoneIds = new Set(
      achievedMilestones.map((m) => m.milestoneId),
    );

    // Award new milestones
    for (const milestone of reachedMilestones) {
      if (!achievedMilestoneIds.has(milestone.id)) {
        // Award milestone
        await db.insert(userStreakMilestones).values({
          userId,
          milestoneId: milestone.id,
        });

        // Award freeze rewards if any
        if (milestone.freezeReward > 0) {
          await this.awardFreezes(userId, milestone.freezeReward);
        }
      }
    }
  }

  /**
   * Get user's achieved milestones
   */
  static async getUserMilestones(userId: string) {
    const achievements = await db.query.userStreakMilestones.findMany({
      where: eq(userStreakMilestones.userId, userId),
      with: {
        milestone: true,
      },
      orderBy: [desc(userStreakMilestones.achievedAt)],
    });

    return achievements;
  }

  /**
   * Utility: Format date to YYYY-MM-DD string
   */
  private static formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Utility: Get yesterday's date
   */
  private static getYesterday(): Date {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
}
