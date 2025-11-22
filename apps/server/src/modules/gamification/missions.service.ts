import { db } from "@/db";
import {
  missions,
  userMissions,
  userDailyActivities,
  type Mission,
  type UserMission,
  type MissionFrequency,
} from "@/db/schema/gamification";
import { eq, and, sql, inArray } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";
import type {
  UserMissionResponse,
  MissionsOverviewResponse,
  RecordActivityBody,
} from "./model";

export class MissionsService {
  /**
   * Get all active missions (for admin to manage)
   */
  static async getAllMissions(): Promise<Mission[]> {
    const allMissions = await db.query.missions.findMany({
      orderBy: [missions.frequency, missions.title],
    });

    return allMissions;
  }

  /**
   * Get mission by ID
   */
  static async getMissionById(id: number): Promise<Mission | null> {
    const mission = await db.query.missions.findFirst({
      where: eq(missions.id, id),
    });

    return mission || null;
  }

  /**
   * Create a new mission
   */
  static async createMission(data: any): Promise<Mission> {
    const [mission] = await db
      .insert(missions)
      .values({
        title: data.title,
        description: data.description,
        type: data.type as any,
        frequency: data.frequency as any,
        targetValue: data.targetValue,
        status: (data.status as any) || "active",
        iconUrl: data.iconUrl,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      })
      .returning();

    return mission;
  }

  /**
   * Update a mission
   */
  static async updateMission(
    id: number,
    data: Partial<Mission>,
  ): Promise<Mission> {
    const [updated] = await db
      .update(missions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(missions.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundError("Mission not found");
    }

    return updated;
  }

  /**
   * Delete a mission
   */
  static async deleteMission(id: number): Promise<void> {
    await db.delete(missions).where(eq(missions.id, id));
  }

  /**
   * Get user's active missions
   */
  static async getUserMissions(userId: string): Promise<MissionsOverviewResponse> {
    const today = this.formatDate(new Date());

    console.log("🎯 [getUserMissions] Called with:", {
      userId,
      serverDate: new Date().toISOString(),
      formattedToday: today,
    });

    // Get user's active missions
    let activeUserMissions = await db.query.userMissions.findMany({
      where: and(
        eq(userMissions.userId, userId),
        eq(userMissions.assignedDate, today),
      ),
      with: {
        mission: true,
      },
    });

    console.log("🎯 [getUserMissions] Query result:", {
      foundMissions: activeUserMissions.length,
      missions: activeUserMissions.map(m => ({
        id: m.id,
        title: m.mission.title,
        frequency: m.mission.frequency,
        assignedDate: m.assignedDate,
      })),
    });

    // If no missions found for today, assign them now
    if (activeUserMissions.length === 0) {
      console.log("🎯 [getUserMissions] No missions found for today, assigning now...");
      await this.assignMissionsToUser(userId, new Date());
      
      // Re-fetch after assignment
      activeUserMissions = await db.query.userMissions.findMany({
        where: and(
          eq(userMissions.userId, userId),
          eq(userMissions.assignedDate, today),
        ),
        with: {
          mission: true,
        },
      });
      
      console.log("🎯 [getUserMissions] After assignment:", {
        foundMissions: activeUserMissions.length,
      });
    }

    // Categorize by frequency
    const daily: UserMissionResponse[] = [];
    const weekly: UserMissionResponse[] = [];
    const monthly: UserMissionResponse[] = [];

    for (const userMission of activeUserMissions) {
      const progressPercentage =
        (userMission.currentProgress / userMission.mission.targetValue) * 100;

      const missionResponse: UserMissionResponse = {
        ...userMission,
        mission: userMission.mission,
        progressPercentage: Math.min(100, Math.round(progressPercentage)),
      };

      switch (userMission.mission.frequency) {
        case "daily":
          daily.push(missionResponse);
          break;
        case "weekly":
          weekly.push(missionResponse);
          break;
        case "monthly":
          monthly.push(missionResponse);
          break;
      }
    }

    console.log("🎯 [getUserMissions] Categorized missions:", {
      daily: daily.length,
      weekly: weekly.length,
      monthly: monthly.length,
    });

    return { daily, weekly, monthly };
  }

  /**
   * Assign missions to a user for a specific date
   * Should be called daily by background worker
   */
  static async assignMissionsToUser(
    userId: string,
    date: Date = new Date(),
  ): Promise<void> {
    const dateStr = this.formatDate(date);

    console.log("🎯 [assignMissionsToUser] Starting assignment:", {
      userId,
      date: date.toISOString(),
      dateStr,
    });

    // Get ALL active missions (daily, weekly, monthly)
    const activeMissions = await db.query.missions.findMany({
      where: eq(missions.status, "active"),
    });

    console.log("🎯 [assignMissionsToUser] Found active missions:", {
      count: activeMissions.length,
      missions: activeMissions.map(m => ({ id: m.id, title: m.title, frequency: m.frequency })),
    });

    // Check if missions already assigned for this date
    const existingAssignments = await db.query.userMissions.findMany({
      where: and(
        eq(userMissions.userId, userId),
        eq(userMissions.assignedDate, dateStr),
      ),
    });

    console.log("🎯 [assignMissionsToUser] Existing assignments:", {
      count: existingAssignments.length,
      assignments: existingAssignments.map(a => ({ missionId: a.missionId, assignedDate: a.assignedDate })),
    });

    const assignedMissionIds = new Set(
      existingAssignments.map((m) => m.missionId),
    );

    // Assign new missions
    let newAssignments = 0;
    for (const mission of activeMissions) {
      if (!assignedMissionIds.has(mission.id)) {
        await db.insert(userMissions).values({
          userId,
          missionId: mission.id,
          assignedDate: dateStr,
          currentProgress: 0,
          isCompleted: false,
        });
        newAssignments++;
      }
    }

    console.log("🎯 [assignMissionsToUser] Completed:", {
      newAssignments,
      totalNow: existingAssignments.length + newAssignments,
    });
  }

  /**
   * Assign missions to all users (for background worker)
   */
  static async assignMissionsToAllUsers(): Promise<void> {
    // Get all user IDs from user table
    const users = await db.query.user.findMany({
      columns: {
        id: true,
      },
    });

    const today = new Date();

    for (const user of users) {
      await this.assignMissionsToUser(user.id, today);
    }
  }

  /**
   * Update mission progress based on activity
   */
  static async updateMissionProgress(
    userId: string,
    activity: RecordActivityBody,
  ): Promise<void> {
    const today = this.formatDate(new Date());

    // Get user's active missions
    const activeUserMissions = await db.query.userMissions.findMany({
      where: and(
        eq(userMissions.userId, userId),
        eq(userMissions.assignedDate, today),
        eq(userMissions.isCompleted, false),
      ),
      with: {
        mission: true,
      },
    });

    // Update progress for relevant missions
    for (const userMission of activeUserMissions) {
      const mission = userMission.mission;
      let shouldUpdate = false;
      let progressIncrement = 1;

      // Check if this activity type matches the mission
      switch (mission.type) {
        case "complete_questions":
          shouldUpdate = activity.type === "question";
          break;
        case "complete_quiz":
          shouldUpdate = activity.type === "quiz";
          break;
        case "read_article":
          shouldUpdate = activity.type === "article";
          break;
        case "complete_trail_content":
          shouldUpdate = activity.type === "trail_content";
          break;
        case "bookmark_articles":
          shouldUpdate = activity.type === "bookmark";
          break;
        case "achieve_score":
          if (activity.type === "quiz" && activity.metadata?.score) {
            shouldUpdate = true;
            progressIncrement = activity.metadata.score;
          }
          break;
        case "spend_time_learning":
          if (activity.metadata?.timeSpentMinutes) {
            shouldUpdate = true;
            progressIncrement = activity.metadata.timeSpentMinutes;
          }
          break;
        // login_daily and complete_streak are handled separately
      }

      if (shouldUpdate) {
        const newProgress = userMission.currentProgress + progressIncrement;
        const isCompleted = newProgress >= mission.targetValue;

        await db
          .update(userMissions)
          .set({
            currentProgress: newProgress,
            isCompleted,
            completedAt: isCompleted ? new Date() : undefined,
            updatedAt: new Date(),
          })
          .where(eq(userMissions.id, userMission.id));

        // Update daily activity mission count if completed
        if (isCompleted && !userMission.isCompleted) {
          await this.incrementDailyMissionCount(userId);
        }
      }
    }
  }

  /**
   * Mark login_daily missions as complete
   */
  static async markLoginMission(userId: string): Promise<void> {
    const today = this.formatDate(new Date());

    const loginMissions = await db.query.userMissions.findMany({
      where: and(
        eq(userMissions.userId, userId),
        eq(userMissions.assignedDate, today),
        eq(userMissions.isCompleted, false),
      ),
      with: {
        mission: true,
      },
    });

    for (const userMission of loginMissions) {
      if (userMission.mission.type === "login_daily") {
        await db
          .update(userMissions)
          .set({
            currentProgress: 1,
            isCompleted: true,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userMissions.id, userMission.id));

        await this.incrementDailyMissionCount(userId);
      }
    }
  }

  /**
   * Increment missions completed count in daily activity
   */
  private static async incrementDailyMissionCount(userId: string): Promise<void> {
    const today = this.formatDate(new Date());

    await db
      .update(userDailyActivities)
      .set({
        missionsCompleted: sql`${userDailyActivities.missionsCompleted} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userDailyActivities.userId, userId),
          eq(userDailyActivities.activityDate, today),
        ),
      );
  }

  /**
   * Determine mission frequency based on date
   * Daily missions are assigned daily
   * Weekly missions on Mondays
   * Monthly missions on 1st of month
   */
  private static getFrequencyForDate(date: Date): MissionFrequency {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday
    const dayOfMonth = date.getDate();

    if (dayOfMonth === 1) {
      return "monthly";
    } else if (dayOfWeek === 1) {
      return "weekly";
    } else {
      return "daily";
    }
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
}
