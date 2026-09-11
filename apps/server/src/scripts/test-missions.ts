// Run with Bun and a local DATABASE_URL. All fixture changes are rolled back.
import { strict as assert } from "node:assert";
import { mock, setSystemTime } from "bun:test";
import { db } from "../db";
import { user } from "../db/schema/auth";
import {
  missions,
  userMissions,
  userDailyActivities,
  userStreaks,
} from "../db/schema/gamification";
import { eq } from "drizzle-orm";

const host = new URL(process.env.DATABASE_URL!).hostname;
assert(
  ["localhost", "127.0.0.1", "[::1]"].includes(host),
  "Use a local test database",
);
const rollback = new Error("rollback fixtures");
setSystemTime(new Date("2026-09-10T12:00:00Z"));
let failures = 0;
await db
  .transaction<void>(async (tx): Promise<void> => {
    mock.module("@/db", () => ({ db: tx }));
    const { MissionsService } =
      await import("../modules/gamification/missions.service");
    const userId = crypto.randomUUID();
    await tx.insert(user).values({
      id: userId,
      name: "Mission regression",
      email: `${userId}@example.invalid`,
    });
    const [daily, weekly, monthly, login, score] = await tx
      .insert(missions)
      .values([
        {
          title: "test daily",
          description: "test",
          type: "complete_questions",
          frequency: "daily",
          targetValue: 3,
        },
        {
          title: "test weekly",
          description: "test",
          type: "complete_questions",
          frequency: "weekly",
          targetValue: 15,
        },
        {
          title: "test monthly",
          description: "test",
          type: "complete_questions",
          frequency: "monthly",
          targetValue: 100,
        },
        {
          title: "test login",
          description: "test",
          type: "login_daily",
          frequency: "daily",
          targetValue: 1,
        },
        {
          title: "test score",
          description: "test",
          type: "achieve_score",
          frequency: "daily",
          targetValue: 80,
        },
      ])
      .returning();
    async function check(name: string, run: () => Promise<void>) {
      try {
        await run();
        console.log(`PASS ${name}`);
      } catch (error) {
        failures++;
        console.error(`FAIL ${name}: ${(error as Error).message}`);
      }
    }
    await check("activity before opening missions is credited", async () => {
      await MissionsService.updateMissionProgress(userId, { type: "question" });
      const result = await MissionsService.getUserMissions(userId);
      assert.equal(
        result.daily.find((m) => m.missionId === daily.id)?.currentProgress,
        1,
      );
    });
    await check(
      "authenticated mission visit completes daily login",
      async () => {
        const result = await MissionsService.getUserMissions(userId);
        assert.equal(
          result.daily.find((m) => m.missionId === login.id)?.isCompleted,
          true,
        );
      },
    );
    await check(
      "weekly and monthly assignment survives another day in period",
      async () => {
        await MissionsService.assignMissionsToUser(
          userId,
          new Date("2026-08-12T12:00:00Z"),
        );
        await MissionsService.assignMissionsToUser(
          userId,
          new Date("2026-08-13T12:00:00Z"),
        );
        const rows = await tx.query.userMissions.findMany({
          where: eq(userMissions.userId, userId),
        });
        assert.equal(
          rows.filter(
            (m) =>
              m.missionId === weekly.id && m.assignedDate.startsWith("2026-08"),
          ).length,
          1,
        );
        assert.equal(
          rows.filter(
            (m) =>
              m.missionId === monthly.id &&
              m.assignedDate.startsWith("2026-08"),
          ).length,
          1,
        );
      },
    );
    await check(
      "score target requires one qualifying score, not their sum",
      async () => {
        await MissionsService.updateMissionProgress(userId, {
          type: "quiz",
          metadata: { score: 40 },
        });
        await MissionsService.updateMissionProgress(userId, {
          type: "quiz",
          metadata: { score: 50 },
        });
        const result = await MissionsService.getUserMissions(userId);
        const mission = result.daily.find((m) => m.missionId === score.id)!;
        assert.equal(mission.currentProgress, 50);
        assert.equal(mission.isCompleted, false);
      },
    );
    await check("repeated visits do not recount completions", async () => {
      const before = await tx.query.userDailyActivities.findFirst({
        where: eq(userDailyActivities.userId, userId),
      });
      await MissionsService.getUserMissions(userId);
      await MissionsService.getUserMissions(userId);
      const after = await tx.query.userDailyActivities.findFirst({
        where: eq(userDailyActivities.userId, userId),
      });
      assert.equal(after?.missionsCompleted, before?.missionsCompleted);
    });
    await check(
      "new missions appear even after other missions were assigned",
      async () => {
        const [late] = await tx
          .insert(missions)
          .values({
            title: "late",
            description: "test",
            type: "read_article",
            frequency: "daily",
            targetValue: 1,
          })
          .returning();
        const result = await MissionsService.getUserMissions(userId);
        assert(result.daily.some((m) => m.missionId === late.id));
      },
    );
    await check(
      "inactive, future, expired and zero-target missions are excluded",
      async () => {
        const invalid = await tx
          .insert(missions)
          .values([
            {
              title: "inactive",
              description: "test",
              type: "read_article",
              frequency: "daily",
              targetValue: 1,
              status: "inactive",
            },
            {
              title: "future",
              description: "test",
              type: "read_article",
              frequency: "daily",
              targetValue: 1,
              validFrom: new Date("2099-01-01"),
            },
            {
              title: "expired",
              description: "test",
              type: "read_article",
              frequency: "daily",
              targetValue: 1,
              validUntil: new Date("2000-01-01"),
            },
            {
              title: "invalid",
              description: "test",
              type: "read_article",
              frequency: "daily",
              targetValue: 0,
            },
          ])
          .returning();
        const ids = invalid.map((m) => m.id);
        const result = await MissionsService.getUserMissions(userId);
        assert(!result.daily.some((m) => ids.includes(m.missionId)));
      },
    );
    await check(
      "daily, Monday and month boundaries create new assignments",
      async () => {
        await MissionsService.assignMissionsToUser(
          userId,
          new Date("2026-08-16T23:59:00Z"),
        );
        await MissionsService.assignMissionsToUser(
          userId,
          new Date("2026-08-17T00:00:00Z"),
        );
        await MissionsService.assignMissionsToUser(
          userId,
          new Date("2026-09-01T00:00:00Z"),
        );
        const rows = await tx.query.userMissions.findMany({
          where: eq(userMissions.userId, userId),
        });
        assert(
          rows.some(
            (m) => m.missionId === daily.id && m.assignedDate === "2026-08-17",
          ),
        );
        assert(
          rows.some(
            (m) => m.missionId === weekly.id && m.assignedDate === "2026-08-17",
          ),
        );
        assert(
          rows.some(
            (m) =>
              m.missionId === monthly.id && m.assignedDate === "2026-09-01",
          ),
        );
      },
    );
    await check(
      "legacy daily assignments contribute to a single weekly card",
      async () => {
        await tx.insert(userMissions).values({
          userId,
          missionId: weekly.id,
          assignedDate: new Date().toISOString().slice(0, 10),
          currentProgress: 2,
        });
        const result = await MissionsService.getUserMissions(userId);
        assert.equal(
          result.weekly.filter((m) => m.missionId === weekly.id).length,
          1,
        );
        assert.equal(
          result.weekly.find((m) => m.missionId === weekly.id)?.currentProgress,
          3,
        );
      },
    );
    await check(
      "a legacy aggregate completion is persisted and counted once",
      async () => {
        const [legacy] = await tx
          .insert(missions)
          .values({
            title: "legacy completion",
            description: "test",
            type: "complete_questions",
            frequency: "weekly",
            targetValue: 10,
          })
          .returning();
        await tx.insert(userMissions).values([
          {
            userId,
            missionId: legacy.id,
            assignedDate: "2026-09-08",
            currentProgress: 5,
          },
          {
            userId,
            missionId: legacy.id,
            assignedDate: "2026-09-09",
            currentProgress: 5,
          },
        ]);
        const before = await tx.query.userDailyActivities.findFirst({
          where: eq(userDailyActivities.userId, userId),
        });
        await MissionsService.getUserMissions(userId);
        const rows = await tx.query.userMissions.findMany({
          where: eq(userMissions.missionId, legacy.id),
        });
        const after = await tx.query.userDailyActivities.findFirst({
          where: eq(userDailyActivities.userId, userId),
        });
        assert(rows.some((row) => row.isCompleted));
        assert.equal(
          after!.missionsCompleted,
          (before?.missionsCompleted ?? 0) + 1,
        );
        await MissionsService.getUserMissions(userId);
        const finalActivity = await tx.query.userDailyActivities.findFirst({
          where: eq(userDailyActivities.userId, userId),
        });
        assert.equal(
          finalActivity!.missionsCompleted,
          after!.missionsCompleted,
        );
      },
    );
    await check(
      "streak missions reflect the current activity streak",
      async () => {
        const [mission] = await tx
          .insert(missions)
          .values({
            title: "streak",
            description: "test",
            type: "complete_streak",
            frequency: "weekly",
            targetValue: 7,
          })
          .returning();
        await tx.insert(userStreaks).values({
          userId,
          currentStreak: 4,
          lastActivityDate: new Date().toISOString().slice(0, 10),
        });
        const result = await MissionsService.getUserMissions(userId);
        assert.equal(
          result.weekly.find((m) => m.missionId === mission.id)
            ?.currentProgress,
          4,
        );
      },
    );
    throw rollback;
  })
  .catch((error) => {
    if (error !== rollback) throw error;
  });
console.log(
  `Mission regression checks: ${failures} failed; fixtures rolled back.`,
);
process.exit(failures ? 1 : 0);
