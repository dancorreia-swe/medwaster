import { t } from "elysia";

export const createArticleSchema = t.Object({
  title: t.String({ minLength: 5, maxLength: 200 }),

  // Source type
  sourceType: t.Optional(
    t.Union([t.Literal("original"), t.Literal("external")]),
  ),

  // Original content fields
  content: t.Optional(t.Any()),
  contentText: t.Optional(t.String()),

  // External reference fields
  externalUrl: t.Optional(t.String()),
  externalAuthors: t.Optional(t.Array(t.String())),
  publicationDate: t.Optional(t.String()), // ISO date string
  publicationSource: t.Optional(t.String()),

  // Common fields
  excerpt: t.Optional(t.String({ maxLength: 500 })),
  readingTimeMinutes: t.Optional(t.Number()), // Manual for external articles
  featuredImageUrl: t.Optional(t.String()),
  categoryId: t.Optional(t.Number()),
  tagIds: t.Optional(t.Array(t.Number())),
  icon: t.Optional(t.String()),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("published"),
      t.Literal("archived"),
    ]),
  ),
});

export const updateArticleSchema = t.Object({
  title: t.Optional(t.String({ minLength: 5, maxLength: 200 })),

  // Source type cannot be changed after creation
  // sourceType is intentionally omitted from update schema

  // Original content fields
  content: t.Optional(t.Any()), // BlockNote content structure
  contentText: t.Optional(t.String()),

  // External reference fields
  externalUrl: t.Optional(t.Union([t.String(), t.Null()])),
  externalAuthors: t.Optional(t.Union([t.Array(t.String()), t.Null()])),
  publicationDate: t.Optional(t.Union([t.String(), t.Null()])), // ISO date string
  publicationSource: t.Optional(t.Union([t.String(), t.Null()])),

  // Common fields
  excerpt: t.Optional(t.String({ maxLength: 500 })),
  readingTimeMinutes: t.Optional(t.Union([t.Number(), t.Null()])),
  metaDescription: t.Optional(t.Union([t.String({ maxLength: 160 }), t.Null()])),
  featuredImageUrl: t.Optional(t.Union([t.String(), t.Null()])),
  categoryId: t.Optional(t.Union([t.Number(), t.Null()])),
  tagIds: t.Optional(t.Array(t.Number())),
  icon: t.Optional(t.Union([t.String(), t.Null()])),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("published"),
      t.Literal("archived"),
    ]),
  ),
});

export const articleListQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("published"),
      t.Literal("archived"),
      t.Literal("all"),
    ]),
  ),
  categoryId: t.Optional(t.Number()),
  authorId: t.Optional(t.String()),
  search: t.Optional(t.String({ maxLength: 100 })),
  tags: t.Optional(t.Array(t.String())),
  sort: t.Optional(
    t.Union([
      t.Literal("created_at"),
      t.Literal("updated_at"),
      t.Literal("title"),
      t.Literal("view_count"),
    ]),
  ),
  order: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
});

export const bulkOperationSchema = t.Object({
  articleIds: t.Array(t.Number()),
  operation: t.Union([
    t.Literal("publish"),
    t.Literal("unpublish"),
    t.Literal("archive"),
    t.Literal("update_category"),
    t.Literal("add_tags"),
    t.Literal("remove_tags"),
  ]),
  parameters: t.Optional(
    t.Object({
      categoryId: t.Optional(t.Number()),
      tagIds: t.Optional(t.Array(t.Number())),
    }),
  ),
});

// Response types

export const articleListItemSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  slug: t.String(),
  sourceType: t.Union([t.Literal("original"), t.Literal("external")]),
  excerpt: t.String(),
  status: t.String(),
  readingTimeMinutes: t.Number(),
  viewCount: t.Number(),
  featuredImageUrl: t.Union([t.String(), t.Null()]),
  icon: t.Union([t.String(), t.Null()]),

  // External reference fields
  externalUrl: t.Union([t.String(), t.Null()]),
  externalAuthors: t.Union([t.Array(t.String()), t.Null()]),
  publicationDate: t.Union([t.String(), t.Null()]),
  publicationSource: t.Union([t.String(), t.Null()]),

  category: t.Union([
    t.Object({
      id: t.Number(),
      name: t.String(),
      color: t.String(),
    }),
    t.Null(),
  ]),
  author: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
  }),
  tags: t.Array(
    t.Object({
      id: t.Number(),
      name: t.String(),
      color: t.String(),
    }),
  ),
  createdAt: t.String(),
  updatedAt: t.String(),
  publishedAt: t.Union([t.String(), t.Null()]),
});

export const articleDetailSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  slug: t.String(),
  sourceType: t.Union([t.Literal("original"), t.Literal("external")]),

  // Original content fields (nullable for external)
  content: t.Union([t.Array(t.Object({})), t.Null()]),
  contentText: t.Union([t.String(), t.Null()]),

  // External reference fields
  externalUrl: t.Union([t.String(), t.Null()]),
  externalAuthors: t.Union([t.Array(t.String()), t.Null()]),
  publicationDate: t.Union([t.String(), t.Null()]),
  publicationSource: t.Union([t.String(), t.Null()]),

  // Common fields
  excerpt: t.String(),
  metaDescription: t.Union([t.String(), t.Null()]),
  featuredImageUrl: t.Union([t.String(), t.Null()]),
  icon: t.Union([t.String(), t.Null()]),
  status: t.String(),
  readingTimeMinutes: t.Number(),
  viewCount: t.Number(),
  category: t.Union([
    t.Object({
      id: t.Number(),
      name: t.String(),
      color: t.String(),
    }),
    t.Null(),
  ]),
  author: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
  }),
  tags: t.Array(
    t.Object({
      id: t.Number(),
      name: t.String(),
      color: t.String(),
    }),
  ),
  relationships: t.Object({
    related: t.Array(
      t.Object({
        id: t.Number(),
        title: t.String(),
        slug: t.String(),
        status: t.String(),
      }),
    ),
    prerequisites: t.Array(
      t.Object({
        id: t.Number(),
        title: t.String(),
        slug: t.String(),
        status: t.String(),
      }),
    ),
    continuations: t.Array(
      t.Object({
        id: t.Number(),
        title: t.String(),
        slug: t.String(),
        status: t.String(),
      }),
    ),
  }),
  createdAt: t.String(),
  updatedAt: t.String(),
  publishedAt: t.Union([t.String(), t.Null()]),
  lastViewedAt: t.Union([t.String(), t.Null()]),
});

export const articleDifficultyValues = ["basic", "intermediate", "advanced"] as const;

export const articleDifficultySchema = t.Union(
  articleDifficultyValues.map((difficulty) => t.Literal(difficulty)),
);

export const studentArticleDifficultySchema = t.Object({
  value: articleDifficultySchema,
  label: t.String(),
  color: t.String(),
});

export const studentArticleProgressSchema = t.Object({
  isRead: t.Boolean(),
  readPercentage: t.Number(),
  timeSpentSeconds: t.Number(),
  lastReadAt: t.Union([t.String(), t.Null()]),
});

export const studentArticleListItemSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  slug: t.String(),
  sourceType: t.Union([t.Literal("original"), t.Literal("external")]),
  icon: t.Union([t.String(), t.Null()]),
  excerpt: t.String(),
  readingTimeMinutes: t.Number(),
  featuredImageUrl: t.Union([t.String(), t.Null()]),

  // External reference fields
  externalUrl: t.Union([t.String(), t.Null()]),
  externalAuthors: t.Union([t.Array(t.String()), t.Null()]),
  publicationSource: t.Union([t.String(), t.Null()]),

  category: t.Union([
    t.Object({
      id: t.Number(),
      name: t.String(),
      color: t.String(),
    }),
    t.Null(),
  ]),
  tags: t.Array(
    t.Object({
      id: t.Number(),
      name: t.String(),
      color: t.String(),
    }),
  ),
  difficulty: studentArticleDifficultySchema,
  isBookmarked: t.Boolean(),
  progress: studentArticleProgressSchema,
});

export const studentArticleDetailSchema = t.Object({
  article: articleDetailSchema,
  difficulty: studentArticleDifficultySchema,
  isBookmarked: t.Boolean(),
  progress: studentArticleProgressSchema,
});

export type CreateArticleData = typeof createArticleSchema.static;
export type UpdateArticleData = typeof updateArticleSchema.static;
export type ArticleListQuery = typeof articleListQuerySchema.static;
export type BulkOperationData = typeof bulkOperationSchema.static;
export type ArticleListItem = typeof articleListItemSchema.static;
export type ArticleDetail = typeof articleDetailSchema.static;
export type ArticleDifficultyValue = (typeof articleDifficultyValues)[number];
export type StudentArticleDifficulty = typeof studentArticleDifficultySchema.static;
export type StudentArticleProgress = typeof studentArticleProgressSchema.static;
export type StudentArticleListItem = typeof studentArticleListItemSchema.static;
export type StudentArticleDetail = typeof studentArticleDetailSchema.static;
