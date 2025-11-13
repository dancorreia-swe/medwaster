import { Queue, type QueueOptions } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 1000,
      age: 7 * 24 * 3600, // 7 days
    },
  },
};

export const ragQueue = new Queue("rag", defaultQueueOptions);
export const gamificationQueue = new Queue("gamification", defaultQueueOptions);

export const QUEUE_NAMES = {
  RAG: "rag",
  GAMIFICATION: "gamification",
} as const;
