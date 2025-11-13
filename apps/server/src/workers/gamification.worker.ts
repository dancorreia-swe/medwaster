import { Worker, Job } from "bullmq";
import { MissionsService } from "@/modules/gamification/missions.service";
import { StreaksService } from "@/modules/gamification/streaks.service";
import { QUEUE_NAMES } from "@/lib/queue";

export type GamificationJobData =
  | {
      type: "assign-daily-missions";
    }
  | {
      type: "check-streaks";
    };

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

export const gamificationWorker = new Worker<GamificationJobData>(
  QUEUE_NAMES.GAMIFICATION,
  async (job: Job<GamificationJobData>) => {
    const { type } = job.data;

    switch (type) {
      case "assign-daily-missions":
        await job.updateProgress(10);
        console.log("[Gamification Worker] Assigning daily missions...");

        await MissionsService.assignMissionsToAllUsers();

        await job.updateProgress(100);

        return {
          type,
          message: "Daily missions assigned to all users",
        };

      case "check-streaks":
        await job.updateProgress(10);
        console.log("[Gamification Worker] Checking streaks...");

        await StreaksService.checkAndBreakStreaks();

        await job.updateProgress(100);

        return {
          type,
          message: "Streak check completed",
        };

      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  },
  {
    connection,
    concurrency: 1, // Run one job at a time
  },
);

gamificationWorker.on("ready", () => {
  console.log("[Gamification Worker] ✓ Ready and listening for jobs");
});

gamificationWorker.on("active", ({ id, data }) => {
  console.log(
    `[Gamification Worker] Job ${id} (${data.type}) started processing`,
  );
});

gamificationWorker.on("progress", ({ id }, progress) => {
  console.log(`[Gamification Worker] Job ${id} progress: ${progress}%`);
});

gamificationWorker.on("completed", (job) => {
  console.log(`[Gamification Worker] Job ${job.id} completed successfully`);
});

gamificationWorker.on("failed", (job, err) => {
  console.error(`[Gamification Worker] Job ${job?.id} failed:`, err.message);
});

gamificationWorker.on("error", (err) => {
  console.error("[Gamification Worker] Worker error:", err);
});
