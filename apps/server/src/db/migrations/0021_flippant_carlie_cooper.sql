CREATE TABLE "user_activity_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_date" date NOT NULL,
	"type" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_activity_events" ADD CONSTRAINT "user_activity_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_activity_events_dedupe_idx" ON "user_activity_events" USING btree ("user_id","activity_date","type","dedupe_key");