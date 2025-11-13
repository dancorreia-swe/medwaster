import "dotenv/config";
import { ragWorker } from "./rag.worker";
import { gamificationWorker } from "./gamification.worker";

console.log("[Workers] Starting BullMQ workers...");
console.log(
  `[Workers] Redis: ${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`,
);
console.log("[Workers] RAG worker initialized");
console.log("[Workers] Gamification worker initialized");

const shutdown = async () => {
  console.log("[Workers] Shutting down gracefully...");
  await ragWorker.close();
  await gamificationWorker.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
