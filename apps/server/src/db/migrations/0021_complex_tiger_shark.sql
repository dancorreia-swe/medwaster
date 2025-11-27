-- Clear old 768-dimension embeddings (incompatible with OpenAI's 1536)
TRUNCATE TABLE "embeddings";--> statement-breakpoint
ALTER TABLE "embeddings" ALTER COLUMN "embedding" SET DATA TYPE vector(1536);