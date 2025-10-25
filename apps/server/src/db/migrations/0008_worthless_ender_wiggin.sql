CREATE TYPE "public"."achievement_category" AS ENUM('trails', 'wiki', 'questions', 'certification', 'engagement', 'general');--> statement-breakpoint
CREATE TYPE "public"."achievement_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."achievement_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."achievement_trigger_type" AS ENUM('complete_trails', 'complete_specific_trail', 'complete_trails_perfect', 'complete_trails_sequence', 'read_category_complete', 'read_articles_count', 'read_time_total', 'read_specific_article', 'bookmark_articles_count', 'question_streak_correct', 'questions_answered_count', 'question_accuracy_rate', 'answer_hard_question', 'complete_quiz_count', 'first_certificate', 'certificate_high_score', 'certificate_fast_approval', 'onboarding_complete', 'first_login', 'login_streak', 'use_ai_assistant', 'manual');--> statement-breakpoint
CREATE TYPE "public"."mission_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."mission_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."mission_type" AS ENUM('complete_questions', 'complete_quiz', 'complete_trail_content', 'read_article', 'bookmark_articles', 'login_daily', 'achieve_score', 'spend_time_learning', 'complete_streak');--> statement-breakpoint
CREATE TYPE "public"."trail_content_type" AS ENUM('question', 'quiz', 'article');--> statement-breakpoint
CREATE TYPE "public"."trail_difficulty" AS ENUM('basic', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."trail_status" AS ENUM('draft', 'published', 'inactive', 'archived');--> statement-breakpoint
CREATE TABLE "achievement_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"achievements_triggered" integer DEFAULT 0 NOT NULL,
	"achievements_unlocked" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" "achievement_category" NOT NULL,
	"difficulty" "achievement_difficulty" DEFAULT 'medium' NOT NULL,
	"status" "achievement_status" DEFAULT 'active' NOT NULL,
	"trigger_type" "achievement_trigger_type" NOT NULL,
	"trigger_config" jsonb,
	"badge_image_url" text,
	"badge_svg" text,
	"custom_message" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"obtained_count" integer DEFAULT 0 NOT NULL,
	"obtained_percentage" real DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" text NOT NULL,
	"achievement_id" integer NOT NULL,
	"progress" real DEFAULT 0 NOT NULL,
	"progress_max" real DEFAULT 100 NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"unlocked_at" timestamp with time zone,
	"trigger_data" jsonb,
	"notified_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" "mission_type" NOT NULL,
	"frequency" "mission_frequency" NOT NULL,
	"status" "mission_status" DEFAULT 'active' NOT NULL,
	"target_value" integer NOT NULL,
	"icon_url" text,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streak_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"days" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"badge_url" text,
	"freeze_reward" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "streak_milestones_days_unique" UNIQUE("days")
);
--> statement-breakpoint
CREATE TABLE "user_daily_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_date" date NOT NULL,
	"questions_completed" integer DEFAULT 0 NOT NULL,
	"quizzes_completed" integer DEFAULT 0 NOT NULL,
	"articles_read" integer DEFAULT 0 NOT NULL,
	"trail_content_completed" integer DEFAULT 0 NOT NULL,
	"time_spent_minutes" integer DEFAULT 0 NOT NULL,
	"missions_completed" integer DEFAULT 0 NOT NULL,
	"streak_day" integer DEFAULT 0 NOT NULL,
	"freeze_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mission_id" integer NOT NULL,
	"assigned_date" date NOT NULL,
	"current_progress" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streak_milestones" (
	"user_id" text NOT NULL,
	"milestone_id" integer NOT NULL,
	"achieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_streak_milestones_pk" PRIMARY KEY("user_id","milestone_id")
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" date,
	"current_streak_start_date" date,
	"total_active_days" integer DEFAULT 0 NOT NULL,
	"freezes_available" integer DEFAULT 0 NOT NULL,
	"freezes_used" integer DEFAULT 0 NOT NULL,
	"last_freeze_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category_id" integer,
	"difficulty" "trail_difficulty" NOT NULL,
	"time_limit_minutes" integer,
	"randomize_questions" boolean DEFAULT false NOT NULL,
	"show_results" boolean DEFAULT true NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trail_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"trail_id" integer NOT NULL,
	"content_type" "trail_content_type" NOT NULL,
	"content_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trail_prerequisites" (
	"trail_id" integer NOT NULL,
	"prerequisite_trail_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trail_prerequisites_pk" PRIMARY KEY("trail_id","prerequisite_trail_id")
);
--> statement-breakpoint
CREATE TABLE "trails" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"trail_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" integer,
	"difficulty" "trail_difficulty" NOT NULL,
	"status" "trail_status" DEFAULT 'draft' NOT NULL,
	"unlock_order" integer NOT NULL,
	"pass_percentage" real DEFAULT 70 NOT NULL,
	"attempts_allowed" integer DEFAULT 3 NOT NULL,
	"time_limit_minutes" integer,
	"allow_skip_questions" boolean DEFAULT false NOT NULL,
	"show_immediate_explanations" boolean DEFAULT true NOT NULL,
	"randomize_content_order" boolean DEFAULT false NOT NULL,
	"cover_image_url" text,
	"theme_color" text,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"estimated_time_minutes" integer,
	"custom_certificate" boolean DEFAULT false NOT NULL,
	"author_id" text NOT NULL,
	"enrolled_count" integer DEFAULT 0 NOT NULL,
	"completion_rate" real DEFAULT 0 NOT NULL,
	"average_completion_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trails_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "trails_trail_id_unique" UNIQUE("trail_id"),
	CONSTRAINT "trails_unlock_order_unique" UNIQUE("unlock_order")
);
--> statement-breakpoint
CREATE TABLE "user_content_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"trail_content_id" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"score" real,
	"time_spent_minutes" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_question_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"question_id" integer NOT NULL,
	"trail_content_id" integer,
	"quiz_attempt_id" integer,
	"is_correct" boolean NOT NULL,
	"user_answer" text NOT NULL,
	"time_spent_seconds" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" integer NOT NULL,
	"trail_content_id" integer,
	"score" real NOT NULL,
	"total_questions" integer NOT NULL,
	"correct_answers" integer NOT NULL,
	"time_spent_minutes" integer NOT NULL,
	"answers" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_trail_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"trail_id" integer NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"is_enrolled" boolean DEFAULT false NOT NULL,
	"current_content_id" integer,
	"completed_content_ids" text DEFAULT '[]' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"best_score" real,
	"current_score" real,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_passed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"time_spent_minutes" integer DEFAULT 0 NOT NULL,
	"enrolled_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_article_bookmarks" (
	"user_id" text NOT NULL,
	"article_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_article_bookmarks_pk" PRIMARY KEY("user_id","article_id")
);
--> statement-breakpoint
CREATE TABLE "user_article_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"article_id" integer NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_percentage" integer DEFAULT 0 NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"first_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	"marked_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievement_events" ADD CONSTRAINT "achievement_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_activities" ADD CONSTRAINT "user_daily_activities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streak_milestones" ADD CONSTRAINT "user_streak_milestones_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streak_milestones" ADD CONSTRAINT "user_streak_milestones_milestone_id_streak_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."streak_milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trail_content" ADD CONSTRAINT "trail_content_trail_id_trails_id_fk" FOREIGN KEY ("trail_id") REFERENCES "public"."trails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trail_prerequisites" ADD CONSTRAINT "trail_prerequisites_trail_id_trails_id_fk" FOREIGN KEY ("trail_id") REFERENCES "public"."trails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trail_prerequisites" ADD CONSTRAINT "trail_prerequisites_prerequisite_trail_id_trails_id_fk" FOREIGN KEY ("prerequisite_trail_id") REFERENCES "public"."trails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trails" ADD CONSTRAINT "trails_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trails" ADD CONSTRAINT "trails_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_content_progress" ADD CONSTRAINT "user_content_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_content_progress" ADD CONSTRAINT "user_content_progress_trail_content_id_trail_content_id_fk" FOREIGN KEY ("trail_content_id") REFERENCES "public"."trail_content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_attempts" ADD CONSTRAINT "user_question_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_attempts" ADD CONSTRAINT "user_question_attempts_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_attempts" ADD CONSTRAINT "user_question_attempts_trail_content_id_trail_content_id_fk" FOREIGN KEY ("trail_content_id") REFERENCES "public"."trail_content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_attempts" ADD CONSTRAINT "user_question_attempts_quiz_attempt_id_user_quiz_attempts_id_fk" FOREIGN KEY ("quiz_attempt_id") REFERENCES "public"."user_quiz_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "user_quiz_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "user_quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_attempts" ADD CONSTRAINT "user_quiz_attempts_trail_content_id_trail_content_id_fk" FOREIGN KEY ("trail_content_id") REFERENCES "public"."trail_content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_trail_progress" ADD CONSTRAINT "user_trail_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_trail_progress" ADD CONSTRAINT "user_trail_progress_trail_id_trails_id_fk" FOREIGN KEY ("trail_id") REFERENCES "public"."trails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_article_bookmarks" ADD CONSTRAINT "user_article_bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_article_bookmarks" ADD CONSTRAINT "user_article_bookmarks_article_id_wiki_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_article_reads" ADD CONSTRAINT "user_article_reads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_article_reads" ADD CONSTRAINT "user_article_reads_article_id_wiki_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievement_events_user_idx" ON "achievement_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "achievement_events_type_idx" ON "achievement_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "achievement_events_created_idx" ON "achievement_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "achievements_category_idx" ON "achievements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "achievements_difficulty_idx" ON "achievements" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "achievements_status_idx" ON "achievements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "achievements_trigger_type_idx" ON "achievements" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "achievements_display_order_idx" ON "achievements" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "achievements_obtained_count_idx" ON "achievements" USING btree ("obtained_count");--> statement-breakpoint
CREATE INDEX "user_achievements_user_idx" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_achievements_achievement_idx" ON "user_achievements" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "user_achievements_unlocked_idx" ON "user_achievements" USING btree ("is_unlocked","unlocked_at");--> statement-breakpoint
CREATE INDEX "user_achievements_progress_idx" ON "user_achievements" USING btree ("user_id","progress");--> statement-breakpoint
CREATE INDEX "missions_type_idx" ON "missions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "missions_frequency_idx" ON "missions" USING btree ("frequency");--> statement-breakpoint
CREATE INDEX "missions_status_idx" ON "missions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "missions_valid_dates_idx" ON "missions" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "streak_milestones_days_idx" ON "streak_milestones" USING btree ("days");--> statement-breakpoint
CREATE INDEX "user_daily_activities_user_idx" ON "user_daily_activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_daily_activities_date_idx" ON "user_daily_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "user_daily_activities_user_date_idx" ON "user_daily_activities" USING btree ("user_id","activity_date");--> statement-breakpoint
CREATE INDEX "user_missions_user_idx" ON "user_missions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_missions_mission_idx" ON "user_missions" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "user_missions_assigned_date_idx" ON "user_missions" USING btree ("assigned_date");--> statement-breakpoint
CREATE INDEX "user_missions_user_date_idx" ON "user_missions" USING btree ("user_id","assigned_date");--> statement-breakpoint
CREATE INDEX "user_missions_completed_idx" ON "user_missions" USING btree ("is_completed","completed_at");--> statement-breakpoint
CREATE INDEX "user_streak_milestones_user_idx" ON "user_streak_milestones" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_streak_milestones_achieved_idx" ON "user_streak_milestones" USING btree ("achieved_at");--> statement-breakpoint
CREATE INDEX "user_streaks_user_idx" ON "user_streaks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_streaks_current_streak_idx" ON "user_streaks" USING btree ("current_streak");--> statement-breakpoint
CREATE INDEX "user_streaks_longest_streak_idx" ON "user_streaks" USING btree ("longest_streak");--> statement-breakpoint
CREATE INDEX "user_streaks_last_activity_idx" ON "user_streaks" USING btree ("last_activity_date");--> statement-breakpoint
CREATE INDEX "quiz_questions_quiz_idx" ON "quiz_questions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_question_idx" ON "quiz_questions" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_sequence_idx" ON "quiz_questions" USING btree ("quiz_id","sequence");--> statement-breakpoint
CREATE INDEX "quizzes_category_idx" ON "quizzes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "quizzes_difficulty_idx" ON "quizzes" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "quizzes_author_idx" ON "quizzes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "trail_content_trail_idx" ON "trail_content" USING btree ("trail_id");--> statement-breakpoint
CREATE INDEX "trail_content_sequence_idx" ON "trail_content" USING btree ("trail_id","sequence");--> statement-breakpoint
CREATE INDEX "trail_content_type_idx" ON "trail_content" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "trail_prerequisites_trail_idx" ON "trail_prerequisites" USING btree ("trail_id");--> statement-breakpoint
CREATE INDEX "trail_prerequisites_prerequisite_idx" ON "trail_prerequisites" USING btree ("prerequisite_trail_id");--> statement-breakpoint
CREATE INDEX "trails_status_idx" ON "trails" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trails_difficulty_idx" ON "trails" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "trails_category_idx" ON "trails" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "trails_author_idx" ON "trails" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "trails_unlock_order_idx" ON "trails" USING btree ("unlock_order");--> statement-breakpoint
CREATE INDEX "trails_created_at_idx" ON "trails" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "trails_updated_at_idx" ON "trails" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "trails_trail_id_idx" ON "trails" USING btree ("trail_id");--> statement-breakpoint
CREATE INDEX "user_content_progress_user_idx" ON "user_content_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_content_progress_content_idx" ON "user_content_progress" USING btree ("trail_content_id");--> statement-breakpoint
CREATE INDEX "user_content_progress_user_content_idx" ON "user_content_progress" USING btree ("user_id","trail_content_id");--> statement-breakpoint
CREATE INDEX "user_question_attempts_user_idx" ON "user_question_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_question_attempts_question_idx" ON "user_question_attempts" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "user_question_attempts_trail_content_idx" ON "user_question_attempts" USING btree ("trail_content_id");--> statement-breakpoint
CREATE INDEX "user_question_attempts_quiz_attempt_idx" ON "user_question_attempts" USING btree ("quiz_attempt_id");--> statement-breakpoint
CREATE INDEX "user_quiz_attempts_user_idx" ON "user_quiz_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_quiz_attempts_quiz_idx" ON "user_quiz_attempts" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "user_quiz_attempts_user_quiz_idx" ON "user_quiz_attempts" USING btree ("user_id","quiz_id");--> statement-breakpoint
CREATE INDEX "user_quiz_attempts_completed_idx" ON "user_quiz_attempts" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "user_trail_progress_user_idx" ON "user_trail_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_trail_progress_trail_idx" ON "user_trail_progress" USING btree ("trail_id");--> statement-breakpoint
CREATE INDEX "user_trail_progress_user_trail_idx" ON "user_trail_progress" USING btree ("user_id","trail_id");--> statement-breakpoint
CREATE INDEX "user_trail_progress_completed_idx" ON "user_trail_progress" USING btree ("is_completed","is_passed");--> statement-breakpoint
CREATE INDEX "user_article_bookmarks_user_idx" ON "user_article_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_article_bookmarks_article_idx" ON "user_article_bookmarks" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "user_article_bookmarks_created_idx" ON "user_article_bookmarks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_article_reads_user_idx" ON "user_article_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_article_reads_article_idx" ON "user_article_reads" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "user_article_reads_user_article_idx" ON "user_article_reads" USING btree ("user_id","article_id");--> statement-breakpoint
CREATE INDEX "user_article_reads_is_read_idx" ON "user_article_reads" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "user_article_reads_last_read_idx" ON "user_article_reads" USING btree ("last_read_at");