CREATE TYPE "public"."achievement_category" AS ENUM('trails', 'wiki', 'questions', 'certification', 'engagement', 'social', 'general');--> statement-breakpoint
CREATE TYPE "public"."achievement_difficulty" AS ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond');--> statement-breakpoint
CREATE TYPE "public"."achievement_status" AS ENUM('draft', 'active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."achievement_type" AS ENUM('milestone', 'progressive', 'streak');--> statement-breakpoint
CREATE TYPE "public"."achievement_visibility" AS ENUM('public', 'secret');--> statement-breakpoint
CREATE TYPE "public"."mission_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."mission_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."mission_type" AS ENUM('complete_questions', 'complete_quiz', 'complete_trail_content', 'read_article', 'bookmark_articles', 'login_daily', 'achieve_score', 'spend_time_learning', 'complete_streak');--> statement-breakpoint
CREATE TYPE "public"."question_difficulty" AS ENUM('basic', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('draft', 'active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('multiple_choice', 'true_false', 'fill_in_the_blank', 'matching');--> statement-breakpoint
CREATE TYPE "public"."quiz_attempt_status" AS ENUM('in_progress', 'completed', 'submitted', 'timed_out', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."quiz_difficulty" AS ENUM('basic', 'intermediate', 'advanced', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."quiz_status" AS ENUM('draft', 'active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."trail_content_type" AS ENUM('question', 'quiz', 'article');--> statement-breakpoint
CREATE TYPE "public"."trail_difficulty" AS ENUM('basic', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."trail_status" AS ENUM('draft', 'published', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."wiki_article_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."wiki_relationship_type" AS ENUM('related', 'prerequisite', 'continuation', 'reference');--> statement-breakpoint
CREATE TABLE "achievement_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	"achievements_evaluated" integer DEFAULT 0,
	"achievements_progressed" jsonb DEFAULT '[]'::jsonb,
	"achievements_unlocked" jsonb DEFAULT '[]'::jsonb,
	"errors" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievement_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"achievement_id" integer NOT NULL,
	"trigger_event" text NOT NULL,
	"trigger_data" jsonb,
	"achievement_snapshot" jsonb,
	"rewards_granted" jsonb,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievement_history_user_achievement_unique" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "achievement_prerequisites" (
	"achievement_id" integer NOT NULL,
	"prerequisite_id" integer NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievement_prerequisites_achievement_id_prerequisite_id_pk" PRIMARY KEY("achievement_id","prerequisite_id")
);
--> statement-breakpoint
CREATE TABLE "achievement_stats" (
	"achievement_id" integer PRIMARY KEY NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"unlocked_count" integer DEFAULT 0 NOT NULL,
	"unlocked_percentage" real DEFAULT 0 NOT NULL,
	"average_progress" real DEFAULT 0,
	"median_progress" real DEFAULT 0,
	"average_time_to_unlock_seconds" integer,
	"last_calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"category" "achievement_category" NOT NULL,
	"difficulty" "achievement_difficulty" DEFAULT 'bronze' NOT NULL,
	"type" "achievement_type" DEFAULT 'milestone' NOT NULL,
	"status" "achievement_status" DEFAULT 'draft' NOT NULL,
	"visibility" "achievement_visibility" DEFAULT 'public' NOT NULL,
	"trigger_config" jsonb NOT NULL,
	"badge" jsonb NOT NULL,
	"rewards" jsonb DEFAULT '{}'::jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" text NOT NULL,
	"achievement_id" integer NOT NULL,
	"current_value" real DEFAULT 0 NOT NULL,
	"target_value" real NOT NULL,
	"progress_percentage" real DEFAULT 0 NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"unlocked_at" timestamp with time zone,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_at" timestamp with time zone,
	"context" jsonb DEFAULT '{}'::jsonb,
	"notified_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_user_id_achievement_id_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
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
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL
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
CREATE TABLE "question_fill_blank_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"placeholder" text,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_fill_blank_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"blank_id" integer NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_matching_pairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"left_text" text NOT NULL,
	"right_text" text NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"label" text NOT NULL,
	"content" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_tags" (
	"question_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"assigned_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_tags_pk" PRIMARY KEY("question_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"explanation" text,
	"type" "question_type" NOT NULL,
	"difficulty" "question_difficulty" NOT NULL,
	"status" "question_status" DEFAULT 'draft' NOT NULL,
	"category_id" integer,
	"author_id" text NOT NULL,
	"image_url" text,
	"references" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"quiz_question_id" integer NOT NULL,
	"selected_options" text,
	"text_answer" text,
	"matching_answers" text,
	"is_correct" boolean,
	"points_earned" integer DEFAULT 0,
	"time_spent" integer,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"status" "quiz_attempt_status" DEFAULT 'in_progress' NOT NULL,
	"score" integer,
	"total_points" integer,
	"earned_points" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"time_spent" integer,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"order" integer NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"instructions" text,
	"difficulty" "quiz_difficulty" NOT NULL,
	"status" "quiz_status" DEFAULT 'draft' NOT NULL,
	"category_id" integer,
	"author_id" text NOT NULL,
	"time_limit" integer,
	"max_attempts" integer DEFAULT 3,
	"show_results" boolean DEFAULT true NOT NULL,
	"show_correct_answers" boolean DEFAULT true NOT NULL,
	"randomize_questions" boolean DEFAULT false NOT NULL,
	"randomize_options" boolean DEFAULT false NOT NULL,
	"passing_score" integer DEFAULT 70,
	"image_url" text,
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
CREATE TABLE "wiki_article_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_article_id" integer NOT NULL,
	"target_article_id" integer NOT NULL,
	"relationship_type" "wiki_relationship_type" NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wiki_article_tags" (
	"article_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"assigned_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_article_tags_pk" PRIMARY KEY("article_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "wiki_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" jsonb NOT NULL,
	"content_text" text,
	"excerpt" text,
	"reading_time_minutes" integer,
	"status" "wiki_article_status" DEFAULT 'draft' NOT NULL,
	"category_id" integer,
	"author_id" text NOT NULL,
	"featured_image_url" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "wiki_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_name" text NOT NULL,
	"stored_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_path" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"associated_article_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_files_stored_filename_unique" UNIQUE("stored_filename")
);
--> statement-breakpoint
ALTER TABLE "achievement_events" ADD CONSTRAINT "achievement_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_history" ADD CONSTRAINT "achievement_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_history" ADD CONSTRAINT "achievement_history_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_prerequisites" ADD CONSTRAINT "achievement_prerequisites_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_prerequisites" ADD CONSTRAINT "achievement_prerequisites_prerequisite_id_achievements_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_stats" ADD CONSTRAINT "achievement_stats_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_article_id_wiki_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_activities" ADD CONSTRAINT "user_daily_activities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streak_milestones" ADD CONSTRAINT "user_streak_milestones_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streak_milestones" ADD CONSTRAINT "user_streak_milestones_milestone_id_streak_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."streak_milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_fill_blank_answers" ADD CONSTRAINT "question_fill_blank_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_fill_blank_options" ADD CONSTRAINT "question_fill_blank_options_blank_id_question_fill_blank_answers_id_fk" FOREIGN KEY ("blank_id") REFERENCES "public"."question_fill_blank_answers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_matching_pairs" ADD CONSTRAINT "question_matching_pairs_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_quiz_question_id_quiz_questions_id_fk" FOREIGN KEY ("quiz_question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "wiki_article_relationships" ADD CONSTRAINT "wiki_article_relationships_source_article_id_wiki_articles_id_fk" FOREIGN KEY ("source_article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_article_relationships" ADD CONSTRAINT "wiki_article_relationships_target_article_id_wiki_articles_id_fk" FOREIGN KEY ("target_article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_article_relationships" ADD CONSTRAINT "wiki_article_relationships_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_article_tags" ADD CONSTRAINT "wiki_article_tags_article_id_wiki_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_article_tags" ADD CONSTRAINT "wiki_article_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_article_tags" ADD CONSTRAINT "wiki_article_tags_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_articles" ADD CONSTRAINT "wiki_articles_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_articles" ADD CONSTRAINT "wiki_articles_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_files" ADD CONSTRAINT "wiki_files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_files" ADD CONSTRAINT "wiki_files_associated_article_id_wiki_articles_id_fk" FOREIGN KEY ("associated_article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievement_events_user_idx" ON "achievement_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "achievement_events_type_idx" ON "achievement_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "achievement_events_processed_idx" ON "achievement_events" USING btree ("processed","created_at");--> statement-breakpoint
CREATE INDEX "achievement_events_created_idx" ON "achievement_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "achievement_history_user_idx" ON "achievement_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "achievement_history_achievement_idx" ON "achievement_history" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "achievement_history_unlocked_idx" ON "achievement_history" USING btree ("unlocked_at");--> statement-breakpoint
CREATE INDEX "achievement_prerequisites_achievement_idx" ON "achievement_prerequisites" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "achievement_prerequisites_prerequisite_idx" ON "achievement_prerequisites" USING btree ("prerequisite_id");--> statement-breakpoint
CREATE INDEX "achievement_stats_unlocked_pct_idx" ON "achievement_stats" USING btree ("unlocked_percentage");--> statement-breakpoint
CREATE INDEX "achievements_category_idx" ON "achievements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "achievements_difficulty_idx" ON "achievements" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "achievements_status_idx" ON "achievements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "achievements_type_idx" ON "achievements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "achievements_visibility_idx" ON "achievements" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "achievements_display_order_idx" ON "achievements" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "user_achievements_user_idx" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_achievements_achievement_idx" ON "user_achievements" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "user_achievements_unlocked_idx" ON "user_achievements" USING btree ("is_unlocked","unlocked_at");--> statement-breakpoint
CREATE INDEX "user_achievements_progress_idx" ON "user_achievements" USING btree ("user_id","progress_percentage");--> statement-breakpoint
CREATE INDEX "idx_audit_timestamp" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_event_type" ON "audit_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_monitor_id_endpoint" ON "rate_limit_monitor" USING btree ("identifier","endpoint");--> statement-breakpoint
CREATE INDEX "content_categories_name_idx" ON "content_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "embedding_index" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
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
CREATE INDEX "question_fill_blank_sequence_idx" ON "question_fill_blank_answers" USING btree ("question_id","sequence");--> statement-breakpoint
CREATE INDEX "question_fill_blank_options_blank_idx" ON "question_fill_blank_options" USING btree ("blank_id");--> statement-breakpoint
CREATE INDEX "question_matching_sequence_idx" ON "question_matching_pairs" USING btree ("question_id","sequence");--> statement-breakpoint
CREATE INDEX "question_options_question_idx" ON "question_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_type_idx" ON "questions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "questions_difficulty_idx" ON "questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "questions_status_idx" ON "questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questions_category_idx" ON "questions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "questions_author_idx" ON "questions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "questions_created_at_idx" ON "questions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "questions_updated_at_idx" ON "questions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "tags_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "quiz_answers_attempt_id_idx" ON "quiz_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_question_id_idx" ON "quiz_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_quiz_question_id_idx" ON "quiz_answers" USING btree ("quiz_question_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "quiz_attempts" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_status_id_idx" ON "quiz_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quiz_attempts_started_at_idx" ON "quiz_attempts" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "quiz_questions_quiz_id_idx" ON "quiz_questions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_question_id_idx" ON "quiz_questions" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_quiz_order_idx" ON "quiz_questions" USING btree ("quiz_id","order");--> statement-breakpoint
CREATE INDEX "quizzes_status_id_idx" ON "quizzes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quizzes_difficulty_id_idx" ON "quizzes" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "quizzes_category_id_idx" ON "quizzes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "quizzes_author_id_idx" ON "quizzes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "quizzes_created_at_ts_idx" ON "quizzes" USING btree ("created_at");--> statement-breakpoint
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
CREATE INDEX "user_article_reads_last_read_idx" ON "user_article_reads" USING btree ("last_read_at");--> statement-breakpoint
CREATE INDEX "idx_wiki_relationships_unique" ON "wiki_article_relationships" USING btree ("source_article_id","target_article_id","relationship_type");--> statement-breakpoint
CREATE INDEX "idx_wiki_relationships_source" ON "wiki_article_relationships" USING btree ("source_article_id");--> statement-breakpoint
CREATE INDEX "idx_wiki_relationships_target" ON "wiki_article_relationships" USING btree ("target_article_id");--> statement-breakpoint
CREATE INDEX "idx_wiki_relationships_type" ON "wiki_article_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "idx_wiki_article_tags_article" ON "wiki_article_tags" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_wiki_article_tags_tag" ON "wiki_article_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_wiki_article_tags_composite" ON "wiki_article_tags" USING btree ("tag_id","article_id");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_status" ON "wiki_articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_category" ON "wiki_articles" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_author" ON "wiki_articles" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_published_at" ON "wiki_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_updated_at" ON "wiki_articles" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_slug" ON "wiki_articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_status_category" ON "wiki_articles" USING btree ("status","category_id");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_status_updated" ON "wiki_articles" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_author_updated" ON "wiki_articles" USING btree ("author_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_wiki_articles_views" ON "wiki_articles" USING btree ("view_count","last_viewed_at");--> statement-breakpoint
CREATE INDEX "idx_wiki_files_article" ON "wiki_files" USING btree ("associated_article_id");--> statement-breakpoint
CREATE INDEX "idx_wiki_files_uploaded_by" ON "wiki_files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_wiki_files_created_at" ON "wiki_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_wiki_files_stored_filename" ON "wiki_files" USING btree ("stored_filename");
