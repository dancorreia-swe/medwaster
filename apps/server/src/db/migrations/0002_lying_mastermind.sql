CREATE TYPE "public"."wiki_article_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."wiki_relationship_type" AS ENUM('related', 'prerequisite', 'continuation', 'reference');--> statement-breakpoint
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
	"meta_description" text,
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