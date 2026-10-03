import "./instrument";
import { ragWorker } from "./rag.worker";
import { gamificationWorker } from "./gamification.worker";
import { Sentry } from "@/lib/sentry";

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
  await Sentry.close(2000);
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
