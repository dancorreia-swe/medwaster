import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  primaryKey,
  vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { contentCategories } from "./categories";
import { tags } from "./questions";

export const wikiArticleStatusValues = [
  "draft",
  "published",
  "archived",
] as const;

export const wikiArticleStatusEnum = pgEnum(
  "wiki_article_status",
  wikiArticleStatusValues,
);

export const wikiRelationshipTypeValues = [
  "related",
  "prerequisite",
  "continuation",
  "reference",
] as const;

export const wikiRelationshipTypeEnum = pgEnum(
  "wiki_relationship_type",
  wikiRelationshipTypeValues,
);

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
  (table) => [
    index("idx_wiki_articles_status").on(table.status),
    index("idx_wiki_articles_category").on(table.categoryId),
    index("idx_wiki_articles_author").on(table.authorId),
    index("idx_wiki_articles_published_at").on(table.publishedAt),
    index("idx_wiki_articles_updated_at").on(table.updatedAt),
    index("idx_wiki_articles_slug").on(table.slug),

    index("idx_wiki_articles_status_category").on(
      table.status,
      table.categoryId,
    ),
    index("idx_wiki_articles_status_updated").on(table.status, table.updatedAt),
    index("idx_wiki_articles_author_updated").on(
      table.authorId,
      table.updatedAt,
    ),
    index("idx_wiki_articles_views").on(table.viewCount, table.lastViewedAt),
  ],
);

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
  (table) => [
    primaryKey({
      columns: [table.articleId, table.tagId],
      name: "wiki_article_tags_pk",
    }),
    index("idx_wiki_article_tags_article").on(table.articleId),
    index("idx_wiki_article_tags_tag").on(table.tagId),
    index("idx_wiki_article_tags_composite").on(table.tagId, table.articleId),
  ],
);

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
  (table) => [
    // Unique constraint to prevent duplicate relationships
    index("idx_wiki_relationships_unique").on(
      table.sourceArticleId,
      table.targetArticleId,
      table.relationshipType,
    ),
    index("idx_wiki_relationships_source").on(table.sourceArticleId),
    index("idx_wiki_relationships_target").on(table.targetArticleId),
    index("idx_wiki_relationships_type").on(table.relationshipType),
  ],
);

export const wikiArticlesRelations = relations(
  wikiArticles,
  ({ one, many }) => ({
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
  }),
);

export const wikiArticleTagsRelations = relations(
  wikiArticleTags,
  ({ one }) => ({
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
  }),
);

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

export const wikiFiles = pgTable(
  "wiki_files",
  {
    id: serial("id").primaryKey(),
    originalName: text("original_name").notNull(),
    storedFilename: text("stored_filename").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    filePath: text("file_path").notNull(),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    associatedArticleId: integer("associated_article_id").references(
      () => wikiArticles.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_wiki_files_article").on(table.associatedArticleId),
    index("idx_wiki_files_uploaded_by").on(table.uploadedBy),
    index("idx_wiki_files_created_at").on(table.createdAt),
    index("idx_wiki_files_stored_filename").on(table.storedFilename),
  ],
);

export const wikiFilesRelations = relations(wikiFiles, ({ one }) => ({
  uploadedByUser: one(user, {
    fields: [wikiFiles.uploadedBy],
    references: [user.id],
  }),
  associatedArticle: one(wikiArticles, {
    fields: [wikiFiles.associatedArticleId],
    references: [wikiArticles.id],
  }),
}));
export const wikiArticlesRelationsUpdated = relations(
  wikiArticles,
  ({ one, many }) => ({
    author: one(user, {
      fields: [wikiArticles.authorId],
      references: [user.id],
    }),
    category: one(contentCategories, {
      fields: [wikiArticles.categoryId],
      references: [contentCategories.id],
    }),
    articleTags: many(wikiArticleTags),
    files: many(wikiFiles),
    sourceRelationships: many(wikiArticleRelationships, {
      relationName: "sourceArticle",
    }),
    targetRelationships: many(wikiArticleRelationships, {
      relationName: "targetArticle",
    }),
  }),
);

export type WikiArticle = typeof wikiArticles.$inferSelect;
export type NewWikiArticle = typeof wikiArticles.$inferInsert;
export type WikiArticleStatus = (typeof wikiArticleStatusValues)[number];
export type WikiRelationshipType = (typeof wikiRelationshipTypeValues)[number];

export type WikiArticleTag = typeof wikiArticleTags.$inferSelect;
export type NewWikiArticleTag = typeof wikiArticleTags.$inferInsert;

export type WikiArticleRelationship =
  typeof wikiArticleRelationships.$inferSelect;
export type NewWikiArticleRelationship =
  typeof wikiArticleRelationships.$inferInsert;

export type WikiFile = typeof wikiFiles.$inferSelect;
export type NewWikiFile = typeof wikiFiles.$inferInsert;
