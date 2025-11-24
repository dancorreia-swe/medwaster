DO $$ BEGIN
 CREATE TYPE "certificate_unlock_requirement" AS ENUM ('trails', 'articles');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "system_config" ADD COLUMN "certificate_title" text DEFAULT 'Conclusão de Trilhas' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_config" ADD COLUMN "certificate_unlock_requirement" "certificate_unlock_requirement" DEFAULT 'trails' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_config" ADD COLUMN "certificate_min_study_hours" integer DEFAULT 0 NOT NULL;
