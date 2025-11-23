CREATE TYPE "public"."wiki_article_source_type" AS ENUM('original', 'external');--> statement-breakpoint
ALTER TABLE "wiki_articles" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wiki_articles" ADD COLUMN "source_type" "wiki_article_source_type" DEFAULT 'original' NOT NULL;--> statement-breakpoint
ALTER TABLE "wiki_articles" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "wiki_articles" ADD COLUMN "external_authors" jsonb;--> statement-breakpoint
ALTER TABLE "wiki_articles" ADD COLUMN "publication_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "wiki_articles" ADD COLUMN "publication_source" text;--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_source_type" ON "wiki_articles" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_source_type_status" ON "wiki_articles" USING btree ("source_type","status");