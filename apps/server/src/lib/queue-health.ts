import { ragQueue } from "./queue";

/**
 * Health check for BullMQ queue system
 */
export async function checkQueueHealth() {
  try {
    const counts = await ragQueue.getJobCounts();
    const isPaused = await ragQueue.isPaused();

    return {
      healthy: true,
      queue: "rag",
      isPaused,
      counts,
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || "6379",
      },
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || "6379",
      },
    };
  }
}
