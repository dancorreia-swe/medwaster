import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { contentCategories, tags } from "./questions";

// Enums for wiki articles
export const wikiArticleStatusValues = ["draft", "published", "archived"] as const;
export const wikiArticleStatusEnum = pgEnum("wiki_article_status", wikiArticleStatusValues);

export const wikiRelationshipTypeValues = [
  "related",
  "prerequisite", 
  "continuation",
  "reference"
] as const;
export const wikiRelationshipTypeEnum = pgEnum("wiki_relationship_type", wikiRelationshipTypeValues);

// Main wiki articles table
export const wikiArticles = pgTable(
  "wiki_articles",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: jsonb("content").notNull(), // BlockNote JSON content
    contentText: text("content_text"), // Plain text for search indexing
    excerpt: text("excerpt"), // Manual or auto-generated summary
    readingTimeMinutes: integer("reading_time_minutes"), // Calculated reading time
    status: wikiArticleStatusEnum("status").notNull().default("draft"),
    categoryId: integer("category_id").references(() => contentCategories.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    featuredImageUrl: text("featured_image_url"), // Optional header image
    metaDescription: text("meta_description"), // SEO description, max 160 chars
    viewCount: integer("view_count").notNull().default(0), // Student view tracking
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }), // Latest student view
    publishedAt: timestamp("published_at", { withTimezone: true }), // Publication timestamp
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Performance indexes
    statusIdx: index("idx_wiki_articles_status").on(table.status),
    categoryIdx: index("idx_wiki_articles_category").on(table.categoryId),
    authorIdx: index("idx_wiki_articles_author").on(table.authorId),
    publishedAtIdx: index("idx_wiki_articles_published_at").on(table.publishedAt),
    updatedAtIdx: index("idx_wiki_articles_updated_at").on(table.updatedAt),
    slugIdx: index("idx_wiki_articles_slug").on(table.slug),
    
    // Composite indexes for common queries
    statusCategoryIdx: index("idx_wiki_articles_status_category").on(table.status, table.categoryId),
    statusUpdatedIdx: index("idx_wiki_articles_status_updated").on(table.status, table.updatedAt),
    authorUpdatedIdx: index("idx_wiki_articles_author_updated").on(table.authorId, table.updatedAt),
    
    // Analytics indexes
    viewsIdx: index("idx_wiki_articles_views").on(table.viewCount, table.lastViewedAt),
  }),
);

// Junction table for article-tag relationships
export const wikiArticleTags = pgTable(
  "wiki_article_tags",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => wikiArticles.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.articleId, table.tagId],
      name: "wiki_article_tags_pk",
    }),
    articleIdx: index("idx_wiki_article_tags_article").on(table.articleId),
    tagIdx: index("idx_wiki_article_tags_tag").on(table.tagId),
    compositeIdx: index("idx_wiki_article_tags_composite").on(table.tagId, table.articleId),
  }),
);

// Table for managing content relationships
export const wikiArticleRelationships = pgTable(
  "wiki_article_relationships",
  {
    id: serial("id").primaryKey(),
    sourceArticleId: integer("source_article_id")
      .notNull()
      .references(() => wikiArticles.id, { onDelete: "cascade" }),
    targetArticleId: integer("target_article_id")
      .notNull()
      .references(() => wikiArticles.id, { onDelete: "cascade" }),
    relationshipType: wikiRelationshipTypeEnum("relationship_type").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate relationships
    uniqueRelationship: index("idx_wiki_relationships_unique").on(
      table.sourceArticleId,
      table.targetArticleId,
      table.relationshipType,
    ),
    sourceIdx: index("idx_wiki_relationships_source").on(table.sourceArticleId),
    targetIdx: index("idx_wiki_relationships_target").on(table.targetArticleId),
    typeIdx: index("idx_wiki_relationships_type").on(table.relationshipType),
  }),
);

// Drizzle relations
export const wikiArticlesRelations = relations(wikiArticles, ({ one, many }) => ({
  author: one(user, {
    fields: [wikiArticles.authorId],
    references: [user.id],
  }),
  category: one(contentCategories, {
    fields: [wikiArticles.categoryId],
    references: [contentCategories.id],
  }),
  articleTags: many(wikiArticleTags),
  sourceRelationships: many(wikiArticleRelationships, {
    relationName: "sourceArticle",
  }),
  targetRelationships: many(wikiArticleRelationships, {
    relationName: "targetArticle",
  }),
}));

export const wikiArticleTagsRelations = relations(wikiArticleTags, ({ one }) => ({
  article: one(wikiArticles, {
    fields: [wikiArticleTags.articleId],
    references: [wikiArticles.id],
  }),
  tag: one(tags, {
    fields: [wikiArticleTags.tagId],
    references: [tags.id],
  }),
  assignedByUser: one(user, {
    fields: [wikiArticleTags.assignedBy],
    references: [user.id],
  }),
}));

export const wikiArticleRelationshipsRelations = relations(
  wikiArticleRelationships,
  ({ one }) => ({
    sourceArticle: one(wikiArticles, {
      fields: [wikiArticleRelationships.sourceArticleId],
      references: [wikiArticles.id],
      relationName: "sourceArticle",
    }),
    targetArticle: one(wikiArticles, {
      fields: [wikiArticleRelationships.targetArticleId],
      references: [wikiArticles.id],
      relationName: "targetArticle",
    }),
    createdByUser: one(user, {
      fields: [wikiArticleRelationships.createdBy],
      references: [user.id],
    }),
  }),
);

// Type exports for TypeScript
export type WikiArticle = typeof wikiArticles.$inferSelect;
export type NewWikiArticle = typeof wikiArticles.$inferInsert;
export type WikiArticleStatus = typeof wikiArticleStatusValues[number];
export type WikiRelationshipType = typeof wikiRelationshipTypeValues[number];

export type WikiArticleTag = typeof wikiArticleTags.$inferSelect;
export type NewWikiArticleTag = typeof wikiArticleTags.$inferInsert;

export type WikiArticleRelationship = typeof wikiArticleRelationships.$inferSelect;
export type NewWikiArticleRelationship = typeof wikiArticleRelationships.$inferInsert;