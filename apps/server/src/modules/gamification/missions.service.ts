import { db } from "@/db";
import {
  missions,
  userMissions,
  userDailyActivities,
  userStreaks,
  type Mission,
  type MissionFrequency,
} from "@/db/schema/gamification";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";
import type { MissionsOverviewResponse, RecordActivityBody } from "./model";

type MissionDatabase = Pick<typeof db, "query" | "insert" | "update" | "execute">;

// Match the UTC activity ledger. Weeks start on Monday.
function periodStart(date: Date, frequency: MissionFrequency): string {
  const start = new Date(date);
  if (frequency === "weekly")
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  if (frequency === "monthly") start.setUTCDate(1);
  return start.toISOString().slice(0, 10);
}

function isAvailable(mission: Mission, date: Date): boolean {
  return (
    mission.status === "active" &&
    mission.targetValue > 0 &&
    (!mission.validFrom || mission.validFrom <= date) &&
    (!mission.validUntil || mission.validUntil > date)
  );
}

export abstract class MissionsService {
  static async getAllMissions(): Promise<Mission[]> {
    return db.query.missions.findMany({
      orderBy: [missions.frequency, missions.title],
    });
  }
  static async getMissionById(id: number): Promise<Mission | null> {
    return (
      (await db.query.missions.findFirst({ where: eq(missions.id, id) })) ||
      null
    );
  }
  static async createMission(data: any): Promise<Mission> {
    const [mission] = await db
      .insert(missions)
      .values({
        title: data.title,
        description: data.description,
        type: data.type,
        frequency: data.frequency,
        targetValue: data.targetValue,
        status: data.status || "active",
        iconUrl: data.iconUrl,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      })
      .returning();
    return mission;
  }
  static async updateMission(
    id: number,
    data: Partial<Mission>,
  ): Promise<Mission> {
    const [updated] = await db
      .update(missions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(missions.id, id))
      .returning();
    if (!updated) throw new NotFoundError("Mission not found");
    return updated;
  }
  static async deleteMission(id: number): Promise<void> {
    await db.delete(missions).where(eq(missions.id, id));
  }

  // Serialize assignment and progress, including requests on other server processes.
  private static async withUser<T>(
    userId: string,
    run: (tx: MissionDatabase) => Promise<T>,
  ): Promise<T> {
    return db.transaction<T>(async (tx): Promise<T> => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext('missions'), hashtext(${userId}))`,
      );
      return run(tx);
    });
  }

  private static async currentMissions(
    tx: MissionDatabase,
    userId: string,
    date: Date,
  ) {
    const today = periodStart(date, "daily");
    const earliest = [
      periodStart(date, "weekly"),
      periodStart(date, "monthly"),
    ].sort()[0];
    const rows = await tx.query.userMissions.findMany({
      where: and(
        eq(userMissions.userId, userId),
        gte(userMissions.assignedDate, earliest),
        lte(userMissions.assignedDate, today),
      ),
      with: { mission: true },
      orderBy: [userMissions.assignedDate, userMissions.id],
    });
    const grouped = new Map<number, typeof rows>();
    for (const row of rows) {
      if (
        !isAvailable(row.mission, date) ||
        row.assignedDate < periodStart(date, row.mission.frequency)
      )
        continue;
      const group = grouped.get(row.missionId) || [];
      group.push(row);
      grouped.set(row.missionId, group);
    }
    return [...grouped.values()].map((group) => {
      const first = group[0];
      const maximum = [
        "achieve_score",
        "complete_streak",
        "login_daily",
      ].includes(first.mission.type);
      // Older versions assigned weekly/monthly missions every day. Preserve
      // contributions without deleting history or showing duplicate cards.
      const progress = maximum
        ? Math.max(...group.map((row) => row.currentProgress))
        : group.reduce((sum, row) => sum + row.currentProgress, 0);
      return {
        ...first,
        currentProgress: Math.min(first.mission.targetValue, progress),
        isCompleted:
          group.some((row) => row.isCompleted) ||
          progress >= first.mission.targetValue,
      };
    });
  }

  private static async ensureAssigned(
    tx: MissionDatabase,
    userId: string,
    date: Date,
  ) {
    const active = await tx.query.missions.findMany({
      where: eq(missions.status, "active"),
    });
    const existing = await this.currentMissions(tx, userId, date);
    const assigned = new Set(existing.map((row) => row.missionId));
    const values = active
      .filter(
        (mission) => isAvailable(mission, date) && !assigned.has(mission.id),
      )
      .map((mission) => ({
        userId,
        missionId: mission.id,
        assignedDate: periodStart(date, mission.frequency),
      }));
    if (values.length) await tx.insert(userMissions).values(values);
  }

  static async assignMissionsToUser(
    userId: string,
    date: Date = new Date(),
  ): Promise<void> {
    await this.withUser(userId, (tx) => this.ensureAssigned(tx, userId, date));
  }
  static async assignMissionsToAllUsers(): Promise<void> {
    const users = await db.query.user.findMany({ columns: { id: true } });
    const today = new Date();
    for (const user of users) await this.assignMissionsToUser(user.id, today);
  }
  static async getUserMissions(
    userId: string,
  ): Promise<MissionsOverviewResponse> {
    return this.withUser(userId, async (tx) => {
      const now = new Date();
      await this.ensureAssigned(tx, userId, now);
      await this.applyProgress(tx, userId, now);
      const result: MissionsOverviewResponse = {
        daily: [],
        weekly: [],
        monthly: [],
      };
      for (const row of await this.currentMissions(tx, userId, now)) {
        result[row.mission.frequency].push({
          ...row,
          progressPercentage: Math.min(
            100,
            Math.round((row.currentProgress / row.mission.targetValue) * 100),
          ),
        });
      }
      return result;
    });
  }
  static async updateMissionProgress(
    userId: string,
    activity: RecordActivityBody,
  ): Promise<void> {
    await this.withUser(userId, async (tx) => {
      const now = new Date();
      await this.ensureAssigned(tx, userId, now);
      await this.applyProgress(tx, userId, now, activity);
    });
  }
  static async markLoginMission(userId: string): Promise<void> {
    await this.getUserMissions(userId);
  }

  private static async applyProgress(
    tx: MissionDatabase,
    userId: string,
    now: Date,
    activity?: RecordActivityBody,
  ) {
    const active = await this.currentMissions(tx, userId, now);
    const streak = await tx.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, userId),
    });
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const currentStreak =
      streak?.lastActivityDate &&
      streak.lastActivityDate >= periodStart(yesterday, "daily")
        ? streak.currentStreak
        : 0;
    let completed = 0;
    for (const row of active) {
      if (row.isCompleted) continue;
      let progress = row.currentProgress;
      let maximum = false;
      switch (row.mission.type) {
        case "login_daily":
          progress = 1;
          maximum = true;
          break;
        case "complete_streak":
          progress = currentStreak;
          maximum = true;
          break;
        case "complete_questions":
          if (activity?.type === "question") progress++;
          break;
        case "complete_quiz":
          if (activity?.type === "quiz") progress++;
          break;
        case "read_article":
          if (activity?.type === "article") progress++;
          break;
        case "complete_trail_content":
          if (activity?.type === "trail_content") progress++;
          break;
        case "bookmark_articles":
          if (activity?.type === "bookmark") progress++;
          break;
        case "achieve_score":
          if (
            activity?.type === "quiz" &&
            Number.isFinite(activity.metadata?.score)
          )
            progress = Math.max(progress, activity.metadata!.score!);
          maximum = true;
          break;
        case "spend_time_learning":
          if (Number.isFinite(activity?.metadata?.timeSpentMinutes))
            progress += Math.max(
              0,
              Math.floor(activity!.metadata!.timeSpentMinutes!),
            );
          break;
      }
      progress = Math.min(row.mission.targetValue, Math.max(0, progress));
      if (progress === row.currentProgress) continue;
      const isCompleted = progress >= row.mission.targetValue;
      await tx
        .update(userMissions)
        .set({
          currentProgress: maximum
            ? progress
            : sql`${userMissions.currentProgress} + ${progress - row.currentProgress}`,
          isCompleted,
          completedAt: isCompleted ? now : null,
          updatedAt: now,
        })
        .where(eq(userMissions.id, row.id));
      if (isCompleted) completed++;
    }
    if (completed) {
      const today = periodStart(now, "daily");
      const existing = await tx.query.userDailyActivities.findFirst({
        where: and(
          eq(userDailyActivities.userId, userId),
          eq(userDailyActivities.activityDate, today),
        ),
      });
      if (existing) {
        await tx
          .update(userDailyActivities)
          .set({
            missionsCompleted: sql`${userDailyActivities.missionsCompleted} + ${completed}`,
            updatedAt: now,
          })
          .where(eq(userDailyActivities.id, existing.id));
      } else {
        await tx
          .insert(userDailyActivities)
          .values({
            userId,
            activityDate: today,
            missionsCompleted: completed,
          });
      }
    }
  }
}
