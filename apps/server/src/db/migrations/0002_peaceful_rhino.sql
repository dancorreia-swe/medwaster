DROP INDEX "trail_content_type_idx";--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "image_key" text;--> statement-breakpoint
ALTER TABLE "trail_content" ADD COLUMN "question_id" integer;--> statement-breakpoint
ALTER TABLE "trail_content" ADD COLUMN "quiz_id" integer;--> statement-breakpoint
ALTER TABLE "trail_content" ADD COLUMN "article_id" integer;--> statement-breakpoint
ALTER TABLE "trail_content" ADD CONSTRAINT "trail_content_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trail_content" ADD CONSTRAINT "trail_content_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trail_content" ADD CONSTRAINT "trail_content_article_id_wiki_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trail_content_question_idx" ON "trail_content" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "trail_content_quiz_idx" ON "trail_content" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "trail_content_article_idx" ON "trail_content" USING btree ("article_id");--> statement-breakpoint
ALTER TABLE "trail_content" DROP COLUMN "content_type";--> statement-breakpoint
ALTER TABLE "trail_content" DROP COLUMN "content_id";--> statement-breakpoint
ALTER TABLE "trail_content" ADD CONSTRAINT "trail_content_type_check" CHECK ((
        ("trail_content"."question_id" IS NOT NULL)::int + 
        ("trail_content"."quiz_id" IS NOT NULL)::int + 
        ("trail_content"."article_id" IS NOT NULL)::int
      ) = 1);--> statement-breakpoint
DROP TYPE "public"."trail_content_type";