import { db } from "@/db";
import {
  achievements,
  userAchievements,
  achievementEvents,
  achievementHistory,
  type TriggerConfig,
} from "@/db/schema/achievements";
import { eq, and, sql } from "drizzle-orm";

/**
 * Event types that can trigger achievements
 */
export type AchievementEventType =
  | "first_login"
  | "onboarding_complete"
  | "login_streak"
  | "trail_completed"
  | "trail_content_completed"
  | "article_read"
  | "question_answered"
  | "quiz_completed"
  | "certificate_earned"
  | "bookmark_created";

/**
 * Achievement Engine - Handles tracking and unlocking achievements
 */
export class AchievementEngine {
  /**
   * Track an event and check for achievement unlocks
   */
  static async trackEvent(
    userId: string,
    eventType: AchievementEventType,
    eventData: Record<string, any> = {},
  ) {
    console.log(`🎯 Tracking achievement event: ${eventType} for user ${userId}`);

    // Record the event
    const [event] = await db
      .insert(achievementEvents)
      .values({
        userId,
        eventType,
        eventData,
        processed: false,
      })
      .returning();

    // Process the event immediately
    await this.processEvent(event.id, userId, eventType, eventData);

    return event;
  }

  /**
   * Process an achievement event and evaluate achievements
   */
  private static async processEvent(
    eventId: number,
    userId: string,
    eventType: AchievementEventType,
    eventData: Record<string, any>,
  ) {
    try {
      // Get all active achievements that could be triggered by this event
      const relevantAchievements = await this.getRelevantAchievements(eventType);

      let evaluated = 0;
      const progressed: number[] = [];
      const unlocked: number[] = [];

      for (const achievement of relevantAchievements) {
        evaluated++;

        const result = await this.evaluateAchievement(
          userId,
          achievement,
          eventType,
          eventData,
        );

        if (result.progressed) {
          progressed.push(achievement.id);
        }

        if (result.unlocked) {
          unlocked.push(achievement.id);
          // Unlock the achievement
          await this.unlockAchievement(userId, achievement, eventData);
        }
      }

      // Update event as processed
      await db
        .update(achievementEvents)
        .set({
          processed: true,
          processedAt: new Date(),
          achievementsEvaluated: evaluated,
          achievementsProgressed: progressed,
          achievementsUnlocked: unlocked,
        })
        .where(eq(achievementEvents.id, eventId));

      console.log(
        `  ✓ Processed event: ${evaluated} evaluated, ${progressed.length} progressed, ${unlocked.length} unlocked`,
      );
    } catch (error) {
      console.error(`  ✗ Error processing event:`, error);

      // Record error
      await db
        .update(achievementEvents)
        .set({
          processed: true,
          processedAt: new Date(),
          errors: { message: error instanceof Error ? error.message : "Unknown error" },
        })
        .where(eq(achievementEvents.id, eventId));
    }
  }

  /**
   * Get achievements relevant to an event type
   */
  private static async getRelevantAchievements(eventType: AchievementEventType) {
    // Map event types to trigger types
    const eventToTriggerMap: Record<AchievementEventType, string[]> = {
      first_login: ["first_login"],
      onboarding_complete: ["onboarding_complete"],
      login_streak: ["login_streak"],
      trail_completed: ["complete_trails", "complete_trails_perfect", "complete_specific_trail"],
      trail_content_completed: ["complete_trails"],
      article_read: ["read_articles_count", "read_category_complete", "read_specific_article"],
      question_answered: ["questions_answered_count", "question_accuracy_rate"],
      quiz_completed: ["complete_quiz_count"],
      certificate_earned: ["first_certificate", "certificate_high_score"],
      bookmark_created: ["bookmark_articles_count"],
    };

    const triggerTypes = eventToTriggerMap[eventType] || [];

    if (triggerTypes.length === 0) {
      return [];
    }

    // Get all active, public achievements with matching trigger types
    const allAchievements = await db.query.achievements.findMany({
      where: and(
        eq(achievements.status, "active"),
      ),
    });

    // Filter by trigger type
    return allAchievements.filter((achievement) => {
      const config = achievement.triggerConfig as TriggerConfig;
      return triggerTypes.includes(config.type);
    });
  }

  /**
   * Evaluate if an achievement should progress or unlock
   */
  private static async evaluateAchievement(
    userId: string,
    achievement: any,
    eventType: AchievementEventType,
    eventData: Record<string, any>,
  ): Promise<{ progressed: boolean; unlocked: boolean }> {
    const config = achievement.triggerConfig as TriggerConfig;

    // Get or create user achievement record
    let userAchievement = await db.query.userAchievements.findFirst({
      where: and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievement.id),
      ),
    });

    // Skip if already unlocked
    if (userAchievement?.isUnlocked) {
      return { progressed: false, unlocked: false };
    }

    // Determine target value based on trigger config
    const targetValue = this.getTargetValue(config);

    // Create user achievement if not exists
    if (!userAchievement) {
      const [newUserAchievement] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId: achievement.id,
          targetValue,
          currentValue: 0,
          progressPercentage: 0,
        })
        .returning();
      userAchievement = newUserAchievement;
    }

    // Calculate new progress based on event
    const newProgress = await this.calculateProgress(
      userId,
      config,
      userAchievement,
      eventData,
    );

    // Update progress
    const progressPercentage = Math.min((newProgress / targetValue) * 100, 100);
    const unlocked = progressPercentage >= 100;

    await db
      .update(userAchievements)
      .set({
        currentValue: newProgress,
        progressPercentage,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id),
        ),
      );

    return {
      progressed: newProgress > userAchievement.currentValue,
      unlocked,
    };
  }

  /**
   * Get target value from trigger config
   */
  private static getTargetValue(config: TriggerConfig): number {
    if ("count" in config.conditions && config.conditions.count) {
      return config.conditions.count;
    }
    if ("streakDays" in config.conditions && config.conditions.streakDays) {
      return config.conditions.streakDays;
    }
    if ("accuracyPercentage" in config.conditions && config.conditions.accuracyPercentage) {
      return config.conditions.accuracyPercentage;
    }
    return 1; // Default for milestone achievements
  }

  /**
   * Calculate new progress value based on trigger type
   */
  private static async calculateProgress(
    userId: string,
    config: TriggerConfig,
    userAchievement: any,
    eventData: Record<string, any>,
  ): Promise<number> {
    switch (config.type) {
      case "first_login":
      case "onboarding_complete":
      case "first_certificate":
        return 1; // Simple milestone

      case "complete_trails":
        // Count completed trails from database
        return await this.countCompletedTrails(userId);

      case "read_articles_count":
        // Count read articles from database
        return await this.countReadArticles(userId);

      case "questions_answered_count":
        // Count answered questions from database
        return await this.countAnsweredQuestions(userId);

      case "question_accuracy_rate": {
        // Calculate accuracy rate with minimum question requirement
        const minimumQuestions =
          "minimumQuestions" in config.conditions
            ? config.conditions.minimumQuestions
            : 1;
        return await this.calculateQuestionAccuracy(userId, minimumQuestions);
      }

      case "login_streak":
        // Get current streak from eventData or gamification system
        return eventData.currentStreak || 0;

      default:
        // For unknown types, increment by 1
        return (userAchievement.currentValue || 0) + 1;
    }
  }

  /**
   * Count completed trails for a user
   */
  private static async countCompletedTrails(userId: string): Promise<number> {
    const result = await db.execute(
      sql`
        SELECT COUNT(DISTINCT trail_id) as count
        FROM user_trail_progress
        WHERE user_id = ${userId}
        AND is_completed = true
      `,
    );
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Count read articles for a user
   */
  private static async countReadArticles(userId: string): Promise<number> {
    const result = await db.execute(
      sql`
        SELECT COUNT(DISTINCT article_id) as count
        FROM user_article_reads
        WHERE user_id = ${userId}
      `,
    );
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Count answered questions for a user
   */
  private static async countAnsweredQuestions(userId: string): Promise<number> {
    const result = await db.execute(
      sql`
        SELECT COUNT(DISTINCT question_id) as count
        FROM user_question_attempts
        WHERE user_id = ${userId}
      `,
    );
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Calculate question accuracy rate for a user
   */
  private static async calculateQuestionAccuracy(
    userId: string,
    minimumQuestions: number,
  ): Promise<number> {
    const result = await db.execute(
      sql`
        SELECT
          COUNT(DISTINCT question_id) as total_questions,
          SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as correct_answers
        FROM user_question_attempts
        WHERE user_id = ${userId}
      `,
    );

    const totalQuestions = Number(result.rows[0]?.total_questions || 0);
    const correctAnswers = Number(result.rows[0]?.correct_answers || 0);

    // If user hasn't met minimum question requirement, return 0
    if (totalQuestions < minimumQuestions) {
      return 0;
    }

    // Calculate accuracy percentage
    const accuracyPercentage = (correctAnswers / totalQuestions) * 100;
    return Math.round(accuracyPercentage * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Unlock an achievement for a user
   */
  private static async unlockAchievement(
    userId: string,
    achievement: any,
    eventData: Record<string, any>,
  ) {
    console.log(`  🎉 Unlocking achievement: ${achievement.name} for user ${userId}`);

    // Update user achievement as unlocked
    await db
      .update(userAchievements)
      .set({
        isUnlocked: true,
        unlockedAt: new Date(),
        progressPercentage: 100,
      })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievement.id),
        ),
      );

    // Record in achievement history
    await db.insert(achievementHistory).values({
      userId,
      achievementId: achievement.id,
      triggerEvent: eventData.eventType || "unknown",
      triggerData: eventData,
      achievementSnapshot: achievement,
      rewardsGranted: achievement.rewards,
    });

    // TODO: Send push notification to mobile app
    // TODO: Grant rewards (points, badges, etc.)

    return true;
  }

  /**
   * Get user's achievement progress
   */
  static async getUserAchievements(userId: string) {
    return db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, userId),
      with: {
        achievement: true,
      },
    });
  }

  /**
   * Get recently unlocked achievements for a user
   */
  static async getRecentlyUnlocked(userId: string, limit: number = 5) {
    return db.query.achievementHistory.findMany({
      where: eq(achievementHistory.userId, userId),
      with: {
        achievement: true,
      },
      orderBy: (history, { desc }) => [desc(history.unlockedAt)],
      limit,
    });
  }
}
