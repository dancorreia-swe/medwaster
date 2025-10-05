import { t } from "elysia";

export const createTagBody = t.Object({
  name: t.String(),
  slug: t.String(),
  description: t.Optional(t.String()),
  color: t.Optional(t.String()),
  createdAt: t.Optional(t.String()),
});

export const updateTagBody = t.Object({
  name: t.Optional(t.String()),
  slug: t.Optional(t.String()),
  description: t.Optional(t.String()),
  color: t.Optional(t.String()),
});

export const tagParams = t.Object({
  id: t.Number(),
});

export const listTagsQuery = t.Object({
  search: t.Optional(t.String({ maxLength: 100 })),
  keys: t.Optional(
    t.Array(
      t.Union([t.Literal("name"), t.Literal("slug")]),
      {
        minItems: 1,
        maxItems: 2,
        uniqueItems: true,
      },
    ),
  ),
});

export type CreateTagBody = typeof createTagBody.static;
export type ListTagsQuery = typeof listTagsQuery.static;
export type UpdateTagBody = typeof updateTagBody.static;
export type TagParams = typeof tagParams.static;
