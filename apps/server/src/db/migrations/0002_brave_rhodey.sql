CREATE TABLE "question_fill_blank_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"blank_id" integer NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question_fill_blank_options" ADD CONSTRAINT "question_fill_blank_options_blank_id_question_fill_blank_answers_id_fk" FOREIGN KEY ("blank_id") REFERENCES "public"."question_fill_blank_answers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "question_fill_blank_options_blank_idx" ON "question_fill_blank_options" USING btree ("blank_id");