import { db } from "@/db";
import {
  userDailyActivities,
  userActivityEvents,
  type UserDailyActivity,
} from "@/db/schema/gamification";
import { eq, and, gte, desc } from "drizzle-orm";
import { StreaksService } from "./streaks.service";
import { MissionsService } from "./missions.service";
import type { DailyActivityResponse, RecordActivityBody } from "./model";

export class DailyActivitiesService {
  /**
   * Get or create today's activity record
   */
  static async getTodayActivity(
    userId: string,
  ): Promise<DailyActivityResponse> {
    const today = this.formatDate(new Date());

    let activity = await db.query.userDailyActivities.findFirst({
      where: and(
        eq(userDailyActivities.userId, userId),
        eq(userDailyActivities.activityDate, today),
      ),
    });

    if (!activity) {
      const [newActivity] = await db
        .insert(userDailyActivities)
        .values({
          userId,
          activityDate: today,
        })
        .returning();
      activity = newActivity;
    }

    return {
      ...activity,
      hasCompletedActivity: this.hasCompletedActivity(activity),
    };
  }

  /**
   * Get activity for a specific date
   */
  static async getActivityByDate(
    userId: string,
    date: Date,
  ): Promise<UserDailyActivity | null> {
    const dateStr = this.formatDate(date);

    const activity = await db.query.userDailyActivities.findFirst({
      where: and(
        eq(userDailyActivities.userId, userId),
        eq(userDailyActivities.activityDate, dateStr),
      ),
    });

    return activity || null;
  }

  /**
   * Get user's activity history
   */
  static async getActivityHistory(
    userId: string,
    days: number = 30,
  ): Promise<UserDailyActivity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = this.formatDate(startDate);

    const activities = await db.query.userDailyActivities.findMany({
      where: and(
        eq(userDailyActivities.userId, userId),
        gte(userDailyActivities.activityDate, startDateStr),
      ),
      orderBy: [desc(userDailyActivities.activityDate)],
    });

    return activities;
  }

  /**
   * Record an activity (question, quiz, article, etc.)
   * This is the main entry point for tracking user activities
   */
  static async recordActivity(
    userId: string,
    activity: RecordActivityBody,
  ): Promise<DailyActivityResponse> {
    const today = this.formatDate(new Date());

    const dedupeKey = this.dedupeKey(activity);
    let eventId: number | undefined;
    if (dedupeKey) {
      const [inserted] = await db
        .insert(userActivityEvents)
        .values({ userId, activityDate: today, type: activity.type, dedupeKey })
        .onConflictDoNothing()
        .returning({ id: userActivityEvents.id });
      if (!inserted) return this.getTodayActivity(userId);
      eventId = inserted.id;
    }

    try {
      return await this.recordActivityUnchecked(userId, activity, today);
    } catch (error) {
      // The idempotency key must not turn a transient downstream failure into
      // a permanently lost activity. Only this request can own eventId.
      if (eventId) {
        await db
          .delete(userActivityEvents)
          .where(eq(userActivityEvents.id, eventId));
      }
      throw error;
    }
  }

  private static async recordActivityUnchecked(
    userId: string,
    activity: RecordActivityBody,
    today: string,
  ): Promise<DailyActivityResponse> {
    // Get or create today's activity
    let dailyActivity = await db.query.userDailyActivities.findFirst({
      where: and(
        eq(userDailyActivities.userId, userId),
        eq(userDailyActivities.activityDate, today),
      ),
    });

    if (!dailyActivity) {
      const [newActivity] = await db
        .insert(userDailyActivities)
        .values({
          userId,
          activityDate: today,
        })
        .returning();
      dailyActivity = newActivity;
    }

    // Update activity counts based on type
    const updates: Partial<UserDailyActivity> = {
      updatedAt: new Date(),
    };

    switch (activity.type) {
      case "question":
        updates.questionsCompleted = dailyActivity.questionsCompleted + 1;
        break;
      case "quiz":
        updates.quizzesCompleted = dailyActivity.quizzesCompleted + 1;
        break;
      case "article":
        updates.articlesRead = dailyActivity.articlesRead + 1;
        break;
      case "trail_content":
        updates.trailContentCompleted = dailyActivity.trailContentCompleted + 1;
        break;
      case "trail_completed":
        console.log("✅ [Daily Activity] Recording trail completion:", {
          userId,
          currentCount: dailyActivity.trailsCompleted,
          newCount: dailyActivity.trailsCompleted + 1,
        });
        updates.trailsCompleted = dailyActivity.trailsCompleted + 1;
        break;
      case "bookmark":
        // Bookmarks don't count in daily activity stats for now
        break;
    }

    // Add time spent if provided
    if (activity.metadata?.timeSpentMinutes) {
      updates.timeSpentMinutes =
        dailyActivity.timeSpentMinutes + activity.metadata.timeSpentMinutes;
    }

    // Update daily activity
    const [updatedActivity] = await db
      .update(userDailyActivities)
      .set(updates)
      .where(eq(userDailyActivities.id, dailyActivity.id))
      .returning();

    console.log("💾 [Daily Activity] Updated activity record:", {
      activityType: activity.type,
      trailsCompleted: updatedActivity.trailsCompleted,
      questionsCompleted: updatedActivity.questionsCompleted,
      articlesRead: updatedActivity.articlesRead,
    });

    // Update user streak (this will increment if it's a new day)
    await StreaksService.updateStreakForActivity(userId);

    // Update mission progress
    await MissionsService.updateMissionProgress(userId, activity);

    return {
      ...updatedActivity,
      hasCompletedActivity: this.hasCompletedActivity(updatedActivity),
    };
  }

  /**
   * Get weekly stats (last 7 days)
   */
  static async getWeeklyStats(userId: string) {
    const activities = await this.getActivityHistory(userId, 7);

    const stats = {
      questionsCompleted: 0,
      quizzesCompleted: 0,
      articlesRead: 0,
      trailContentCompleted: 0,
      trailsCompleted: 0,
      timeSpentMinutes: 0,
      activeDays: activities.length,
    };

    for (const activity of activities) {
      stats.questionsCompleted += activity.questionsCompleted;
      stats.quizzesCompleted += activity.quizzesCompleted;
      stats.articlesRead += activity.articlesRead;
      stats.trailContentCompleted += activity.trailContentCompleted;
      stats.trailsCompleted += activity.trailsCompleted;
      stats.timeSpentMinutes += activity.timeSpentMinutes;
    }

    console.log("📈 [Weekly Stats] Calculated for user:", {
      userId,
      stats,
      activitiesCount: activities.length,
    });

    return stats;
  }

  /**
   * Check if user has completed any activity today
   */
  private static hasCompletedActivity(activity: UserDailyActivity): boolean {
    return (
      activity.questionsCompleted > 0 ||
      activity.quizzesCompleted > 0 ||
      activity.articlesRead > 0 ||
      activity.trailContentCompleted > 0 ||
      activity.trailsCompleted > 0
    );
  }

  /**
   * Utility: Format date to YYYY-MM-DD string in UTC
   */
  private static formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
    const day = `${date.getUTCDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private static dedupeKey(activity: RecordActivityBody): string | null {
    if (activity.type === "trail_content" && activity.metadata?.trailContentId)
      return `trail-content:${activity.metadata.trailContentId}`;
    if (activity.type === "article" && activity.metadata?.articleId)
      return `article:${activity.metadata.articleId}`;
    return null;
  }
}
