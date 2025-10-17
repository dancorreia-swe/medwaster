import { t } from "elysia";

// Base types for wiki articles
export const createArticleSchema = t.Object({
  title: t.String({ minLength: 5, maxLength: 200 }),
  content: t.Object({}), // BlockNote JSON content (any object structure)
  excerpt: t.Optional(t.String({ maxLength: 500 })),
  metaDescription: t.Optional(t.String({ maxLength: 160 })),
  featuredImageUrl: t.Optional(t.String()),
  categoryId: t.Optional(t.Number()),
  tagIds: t.Optional(t.Array(t.Number())),
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
  content: t.Optional(t.Object({})),
  excerpt: t.Optional(t.String({ maxLength: 500 })),
  metaDescription: t.Optional(t.String({ maxLength: 160 })),
  featuredImageUrl: t.Optional(t.String()),
  categoryId: t.Optional(t.Number()),
  tagIds: t.Optional(t.Array(t.Number())),
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
  excerpt: t.String(),
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
  createdAt: t.String(),
  updatedAt: t.String(),
  publishedAt: t.Union([t.String(), t.Null()]),
});

export const articleDetailSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  slug: t.String(),
  content: t.Object({}), // BlockNote JSON
  contentText: t.String(),
  excerpt: t.String(),
  metaDescription: t.Union([t.String(), t.Null()]),
  featuredImageUrl: t.Union([t.String(), t.Null()]),
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

export type CreateArticleData = typeof createArticleSchema.static;
export type UpdateArticleData = typeof updateArticleSchema.static;
export type ArticleListQuery = typeof articleListQuerySchema.static;
export type BulkOperationData = typeof bulkOperationSchema.static;
export type ArticleListItem = typeof articleListItemSchema.static;
export type ArticleDetail = typeof articleDetailSchema.static;
