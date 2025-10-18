ALTER TABLE "wiki_articles" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "wiki_articles" DROP COLUMN "meta_description";