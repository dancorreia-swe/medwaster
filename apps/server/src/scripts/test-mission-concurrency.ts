// Real concurrent connections; only the fixtures created here are removed.
import { strict as assert } from "node:assert";
import { db } from "../db";
import { user } from "../db/schema/auth";
import {
  missions,
  userMissions,
  userDailyActivities,
} from "../db/schema/gamification";
import { MissionsService } from "../modules/gamification/missions.service";
import { eq } from "drizzle-orm";

assert(
  ["localhost", "127.0.0.1", "[::1]"].includes(
    new URL(process.env.DATABASE_URL!).hostname,
  ),
  "Use a local test database",
);
const userId = crypto.randomUUID();
let missionId: number | undefined;
let failed = false;
try {
  await db
    .insert(user)
    .values({
      id: userId,
      name: "Mission concurrency",
      email: `${userId}@example.invalid`,
    });
  const [mission] = await db
    .insert(missions)
    .values({
      title: `Concurrency ${userId}`,
      description: "test fixture",
      type: "complete_questions",
      frequency: "daily",
      targetValue: 10,
    })
    .returning();
  missionId = mission.id;
  await Promise.all(
    Array.from({ length: 5 }, () =>
      MissionsService.assignMissionsToUser(userId),
    ),
  );
  const assignments = await db.query.userMissions.findMany({
    where: eq(userMissions.userId, userId),
  });
  assert.equal(
    assignments.filter((row) => row.missionId === missionId).length,
    1,
  );
  console.log("PASS concurrent assignment creates one assignment per mission");
  await Promise.all(
    Array.from({ length: 8 }, () =>
      MissionsService.updateMissionProgress(userId, { type: "question" }),
    ),
  );
  const first = await MissionsService.getUserMissions(userId);
  assert.equal(
    first.daily.find((row) => row.missionId === missionId)?.currentProgress,
    8,
  );
  console.log("PASS concurrent activities do not lose progress");
  await Promise.all(
    Array.from({ length: 8 }, () =>
      MissionsService.updateMissionProgress(userId, { type: "question" }),
    ),
  );
  const result = await MissionsService.getUserMissions(userId);
  assert.equal(
    result.daily.find((row) => row.missionId === missionId)?.currentProgress,
    10,
  );
  const before = await db.query.userDailyActivities.findFirst({
    where: eq(userDailyActivities.userId, userId),
  });
  await Promise.all(
    Array.from({ length: 5 }, () => MissionsService.getUserMissions(userId)),
  );
  const after = await db.query.userDailyActivities.findFirst({
    where: eq(userDailyActivities.userId, userId),
  });
  assert.equal(after?.missionsCompleted, before?.missionsCompleted);
  assert.equal(
    after?.missionsCompleted,
    Object.values(result)
      .flat()
      .filter((row) => row.isCompleted).length,
  );
  console.log("PASS concurrent completion is capped and counted once");
} catch (error) {
  failed = true;
  console.error(error);
} finally {
  await db.delete(user).where(eq(user.id, userId));
  if (missionId !== undefined)
    await db.delete(missions).where(eq(missions.id, missionId));
}
console.log("Concurrency fixtures removed.");
process.exit(failed ? 1 : 0);
