LOCK TABLE "system_config" IN ACCESS EXCLUSIVE MODE;
--> statement-breakpoint
DELETE FROM "system_config"
WHERE "id" NOT IN (
  SELECT "id"
  FROM "system_config"
  ORDER BY "updated_at" DESC, "id" DESC
  LIMIT 1
);
--> statement-breakpoint
ALTER TABLE "system_config"
  ADD COLUMN "singleton_key" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_config"
  ADD COLUMN "certificate_design_revision" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_config"
  ADD CONSTRAINT "system_config_singleton_key_unique" UNIQUE ("singleton_key");
--> statement-breakpoint
ALTER TABLE "system_config"
  ADD CONSTRAINT "system_config_singleton_key_check" CHECK ("singleton_key" = 1);
--> statement-breakpoint
ALTER TABLE "system_config"
  ADD CONSTRAINT "system_config_certificate_design_revision_positive"
  CHECK ("certificate_design_revision" > 0);
--> statement-breakpoint
INSERT INTO "system_config" ("singleton_key", "certificate_design_revision")
SELECT 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "system_config");
