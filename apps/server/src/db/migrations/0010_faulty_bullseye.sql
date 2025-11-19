ALTER TABLE "trails" ALTER COLUMN "attempts_allowed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "trails" ALTER COLUMN "attempts_allowed" DROP NOT NULL;