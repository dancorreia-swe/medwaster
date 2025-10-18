import { Worker, Job } from "bullmq";
import { db } from "@/db";
import { AIService } from "@/modules/ai/service";
import { embeddings as embeddingsTable } from "@/db/schema/embeddings";
import { eq } from "drizzle-orm";
import { QUEUE_NAMES } from "@/lib/queue";

export type RAGJobData = {
  type: "generate-embeddings";
  articleId: number;
  content: string;
};

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

export const ragWorker = new Worker<RAGJobData>(
  QUEUE_NAMES.RAG,
  async (job: Job<RAGJobData>) => {
    const { articleId, content } = job.data;

    await job.updateProgress(10);

    await db
      .delete(embeddingsTable)
      .where(eq(embeddingsTable.articleId, articleId));

    await job.updateProgress(30);

    const embeddings = await AIService.generateEmbeddings(content);

    await job.updateProgress(70);

    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        articleId,
        ...embedding,
      })),
    );

    await job.updateProgress(100);

    return {
      articleId,
      embeddingsCount: embeddings.length,
    };
  },
  {
    connection,
    concurrency: 4,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

ragWorker.on("ready", () => {
  console.log("[RAG Worker] ✓ Ready and listening for jobs");
});

ragWorker.on("active", ({ id, data }) => {
  console.log(
    `[RAG Worker] Job ${id} Article ${data.articleId} started processing`,
  );
});

ragWorker.on("progress", ({ id }, progress) => {
  console.log(`[RAG Worker] Job ${id} progress: ${progress}%`);
});

ragWorker.on("completed", (job) => {
  console.log(`[RAG Worker] Job ${job.id} completed successfully`);
});

ragWorker.on("failed", (job, err) => {
  console.error(`[RAG Worker] Job ${job?.id} failed:`, err.message);
});

ragWorker.on("error", (err) => {
  console.error("[RAG Worker] Worker error:", err);
});
