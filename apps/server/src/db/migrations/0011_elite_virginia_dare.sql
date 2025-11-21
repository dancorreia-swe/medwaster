CREATE TABLE "system_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"auto_approve_certificates" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
