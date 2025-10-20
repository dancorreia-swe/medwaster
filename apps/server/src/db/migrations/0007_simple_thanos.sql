DROP INDEX "content_categories_type_idx";--> statement-breakpoint
ALTER TABLE "content_categories" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE "public"."content_category_type";