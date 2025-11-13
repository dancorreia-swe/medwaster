CREATE TYPE "public"."certificate_status" AS ENUM('pending', 'approved', 'rejected', 'revoked');--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"status" "certificate_status" DEFAULT 'pending' NOT NULL,
	"average_score" real NOT NULL,
	"total_trails_completed" integer NOT NULL,
	"total_time_minutes" integer NOT NULL,
	"all_trails_completed_at" timestamp with time zone NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"verification_code" text NOT NULL,
	"certificate_url" text,
	"issued_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "certificates_verification_code_unique" UNIQUE("verification_code")
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "certificates_user_idx" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "certificates_status_idx" ON "certificates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "certificates_verification_idx" ON "certificates" USING btree ("verification_code");--> statement-breakpoint
CREATE INDEX "certificates_reviewed_by_idx" ON "certificates" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "certificates_issued_at_idx" ON "certificates" USING btree ("issued_at");