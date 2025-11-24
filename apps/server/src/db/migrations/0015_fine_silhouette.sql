CREATE TYPE "public"."certificate_unlock_requirement" AS ENUM('trails', 'articles');--> statement-breakpoint
ALTER TABLE "system_config" ADD COLUMN "certificate_title" text DEFAULT 'Conclusão de Trilhas' NOT NULL;--> statement-breakpoint
ALTER TABLE "system_config" ADD COLUMN "certificate_unlock_requirement" "certificate_unlock_requirement" DEFAULT 'trails' NOT NULL;--> statement-breakpoint
ALTER TABLE "system_config" ADD COLUMN "certificate_min_study_hours" integer DEFAULT 0 NOT NULL;