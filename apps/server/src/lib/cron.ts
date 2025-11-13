import { gamificationQueue } from "./queue";
import type { GamificationJobData } from "@/workers/gamification.worker";

/**
 * Setup cron jobs for gamification features
 */
export async function setupGamificationCron() {
  // Assign daily missions at midnight (00:00)
  await gamificationQueue.add(
    "assign-daily-missions",
    {
      type: "assign-daily-missions",
    } as GamificationJobData,
    {
      repeat: {
        pattern: "0 0 * * *", // Every day at midnight
      },
      jobId: "daily-mission-assignment",
    },
  );

  console.log("[Cron] Daily mission assignment scheduled for midnight");

  // Check and break streaks at 1 AM
  await gamificationQueue.add(
    "check-streaks",
    {
      type: "check-streaks",
    } as GamificationJobData,
    {
      repeat: {
        pattern: "0 1 * * *", // Every day at 1 AM
      },
      jobId: "daily-streak-check",
    },
  );

  console.log("[Cron] Daily streak check scheduled for 1 AM");
}

/**
 * Call this on server startup to initialize cron jobs
 */
export async function initializeCronJobs() {
  try {
    await setupGamificationCron();
    console.log("[Cron] All cron jobs initialized successfully");
  } catch (error) {
    console.error("[Cron] Error initializing cron jobs:", error);
  }
}
