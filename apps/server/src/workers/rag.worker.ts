import { Worker, Job } from "bullmq";
import { db } from "@/db";
import { AIService } from "@/modules/ai/service";
import { embeddings as embeddingsTable } from "@/db/schema/embeddings";
import { eq } from "drizzle-orm";
import { QUEUE_NAMES } from "@/lib/queue";
import { contentScraperService } from "@/modules/wiki/services/content-scraper";

export type RAGJobData =
  | {
      type: "generate-embeddings";
      articleId: number;
      content: string;
    }
  | {
      type: "scrape-and-embed";
      articleId: number;
      url: string;
    };

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

export const ragWorker = new Worker<RAGJobData>(
  QUEUE_NAMES.RAG,
  async (job: Job<RAGJobData>) => {
    const { type, articleId } = job.data;

    await job.updateProgress(5);

    // Delete existing embeddings for this article
    await db
      .delete(embeddingsTable)
      .where(eq(embeddingsTable.articleId, articleId));

    await job.updateProgress(15);

    let content: string;

    if (type === "generate-embeddings") {
      // Direct content from original article
      content = job.data.content;
      await job.updateProgress(30);
    } else if (type === "scrape-and-embed") {
      // Scrape external URL
      const { url } = job.data;
      console.log(`[RAG Worker] Scraping URL: ${url}`);

      await job.updateProgress(20);

      const scrapeResult = await contentScraperService.scrapeExternalArticle(url, {
        timeout: 45000, // 45 seconds for scraping
      });

      await job.updateProgress(40);

      if (!scrapeResult.success || !scrapeResult.content) {
        const errorMsg = scrapeResult.error || "Failed to scrape content";
        console.error(`[RAG Worker] Scrape failed for article ${articleId}: ${errorMsg}`);
        throw new Error(`Scraping failed: ${errorMsg}`);
      }

      content = scrapeResult.content;
      console.log(`[RAG Worker] Successfully scraped ${content.length} characters from ${url}`);
    } else {
      throw new Error(`Unknown job type: ${type}`);
    }

    // Generate embeddings from the content
    await job.updateProgress(50);

    const embeddings = await AIService.generateEmbeddings(content);

    await job.updateProgress(80);

    // Store embeddings in database
    if (embeddings.length > 0) {
      await db.insert(embeddingsTable).values(
        embeddings.map((embedding) => ({
          articleId,
          ...embedding,
        })),
      );
    }

    await job.updateProgress(100);

    return {
      articleId,
      type,
      embeddingsCount: embeddings.length,
      contentLength: content.length,
    };
  },
  {
    connection,
    concurrency: 4,
    limiter: {
      max: 10,
      duration: 1000,
    },
    settings: {
      backoffStrategy(attemptsMade: number) {
        // Exponential backoff: 5s, 15s, 30s
        return Math.min(5000 * Math.pow(2, attemptsMade - 1), 30000);
      },
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
