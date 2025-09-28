CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"user_id" text,
	"session_id" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"resource_type" text,
	"resource_id" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"additional_context" jsonb,
	"checksum" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_monitor" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"endpoint" text NOT NULL,
	"attempt_count" integer DEFAULT 0,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"last_attempt" timestamp DEFAULT now() NOT NULL,
	"alert_threshold" integer DEFAULT 10
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_timestamp" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_event_type" ON "audit_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_monitor_id_endpoint" ON "rate_limit_monitor" USING btree ("identifier","endpoint");