import { t } from "elysia";

export const createTagBody = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 50,
    description: "Tag name (e.g., 'Surgery', 'Cardiology')"
  }),
  slug: t.String({
    minLength: 1,
    maxLength: 50,
    pattern: "^[a-z0-9-]+$",
    description: "URL-friendly identifier (e.g., 'surgery', 'cardiology')"
  }),
  description: t.Optional(t.String({
    maxLength: 500,
    description: "Brief description of the tag's purpose"
  })),
  color: t.Optional(t.String({
    pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    description: "Hex color code for tag display (e.g., '#FF5733'). Auto-generated if not provided."
  })),
});

export const updateTagBody = t.Object({
  name: t.Optional(t.String({ 
    minLength: 1, 
    maxLength: 50,
    description: "Tag name" 
  })),
  slug: t.Optional(t.String({ 
    minLength: 1, 
    maxLength: 50,
    pattern: "^[a-z0-9-]+$",
    description: "URL-friendly identifier" 
  })),
  description: t.Optional(t.String({ 
    maxLength: 500,
    description: "Tag description" 
  })),
  color: t.Optional(t.String({ 
    pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    description: "Hex color code" 
  })),
});

export const tagParams = t.Object({
  id: t.Number({ 
    description: "Tag ID" 
  }),
});

export const listTagsQuery = t.Object({
  search: t.Optional(t.String({ 
    maxLength: 100,
    description: "Search term to filter tags by name or slug" 
  })),
  keys: t.Optional(
    t.Array(
      t.Union([t.Literal("name"), t.Literal("slug")]),
      {
        minItems: 1,
        maxItems: 2,
        uniqueItems: true,
        description: "Fields to search in (default: both name and slug)",
      },
    ),
  ),
});

export type CreateTagBody = typeof createTagBody.static;
export type ListTagsQuery = typeof listTagsQuery.static;
export type UpdateTagBody = typeof updateTagBody.static;
export type TagParams = typeof tagParams.static;
