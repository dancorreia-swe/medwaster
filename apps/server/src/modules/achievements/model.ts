import { achievements } from "@/db/schema/achievements";
import { createInsertSchema, createUpdateSchema } from "drizzle-typebox";
import { t } from "elysia";

export const createAchievementBody = createInsertSchema(achievements, {
  name: (schema) =>
    t.String({
      ...schema,
      description: "Unique name/title of the achievement",
      minLength: 1,
      maxLength: 255,
    }),
  description: (schema) =>
    t.String({
      ...schema,
      description: "Detailed description of the achievement and how to unlock it",
      maxLength: 500,
    }),
  category: (schema) =>
    t.Union(
      [
        t.Literal("trails"),
        t.Literal("wiki"),
        t.Literal("questions"),
        t.Literal("certification"),
        t.Literal("engagement"),
        t.Literal("general"),
      ],
      { ...schema, description: "Category of the achievement" },
    ),
  difficulty: (schema) =>
    t.Optional(
      t.Union([t.Literal("easy"), t.Literal("medium"), t.Literal("hard")], {
        ...schema,
        description: "Difficulty level of the achievement",
        default: "medium",
      }),
    ),
  status: (schema) =>
    t.Optional(
      t.Union(
        [t.Literal("active"), t.Literal("inactive"), t.Literal("archived")],
        {
          ...schema,
          description: "Status of the achievement",
          default: "active",
        },
      ),
    ),
  triggerType: (schema) =>
    t.String({
      ...schema,
      description: "Type of event that triggers this achievement",
    }),
  triggerConfig: t.Optional(
    t.Any({
      description:
        "Configuration object for trigger conditions (e.g., threshold values, specific IDs)",
    }),
  ),
  badgeImageUrl: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "URL to the achievement badge image",
      }),
    ),
  badgeSvg: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "SVG code for the achievement badge",
      }),
    ),
  customMessage: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Custom message displayed when achievement is unlocked",
      }),
    ),
  displayOrder: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Display order for sorting achievements",
        default: 0,
      }),
    ),
  isSecret: (schema) =>
    t.Optional(
      t.Boolean({
        ...schema,
        description:
          "Whether the achievement is hidden until unlocked (secret achievement)",
        default: false,
      }),
    ),
});
export type CreateAchievementBody = typeof createAchievementBody.static;

export const updateAchievementBody = createUpdateSchema(achievements, {
  name: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Unique name/title of the achievement",
        minLength: 1,
        maxLength: 255,
      }),
    ),
  description: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description:
          "Detailed description of the achievement and how to unlock it",
        maxLength: 500,
      }),
    ),
  category: (schema) =>
    t.Optional(
      t.Union(
        [
          t.Literal("trails"),
          t.Literal("wiki"),
          t.Literal("questions"),
          t.Literal("certification"),
          t.Literal("engagement"),
          t.Literal("general"),
        ],
        { ...schema, description: "Category of the achievement" },
      ),
    ),
  difficulty: (schema) =>
    t.Optional(
      t.Union([t.Literal("easy"), t.Literal("medium"), t.Literal("hard")], {
        ...schema,
        description: "Difficulty level of the achievement",
      }),
    ),
  status: (schema) =>
    t.Optional(
      t.Union(
        [t.Literal("active"), t.Literal("inactive"), t.Literal("archived")],
        {
          ...schema,
          description: "Status of the achievement",
        },
      ),
    ),
  triggerType: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Type of event that triggers this achievement",
      }),
    ),
  triggerConfig: t.Optional(
    t.Any({
      description:
        "Configuration object for trigger conditions (e.g., threshold values, specific IDs)",
    }),
  ),
  badgeImageUrl: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "URL to the achievement badge image",
      }),
    ),
  badgeSvg: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "SVG code for the achievement badge",
      }),
    ),
  customMessage: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Custom message displayed when achievement is unlocked",
      }),
    ),
  displayOrder: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Display order for sorting achievements",
      }),
    ),
  isSecret: (schema) =>
    t.Optional(
      t.Boolean({
        ...schema,
        description:
          "Whether the achievement is hidden until unlocked (secret achievement)",
      }),
    ),
});
export type UpdateAchievementBody = typeof updateAchievementBody.static;
