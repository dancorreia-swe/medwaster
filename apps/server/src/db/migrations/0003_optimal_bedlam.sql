ALTER TABLE "trails" DROP CONSTRAINT "trails_unlock_order_unique";--> statement-breakpoint
ALTER TABLE "trails" ALTER COLUMN "unlock_order" DROP NOT NULL;