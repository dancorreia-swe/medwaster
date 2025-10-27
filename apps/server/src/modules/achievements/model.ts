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
  targetCount: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Target count for count-based achievements (e.g., read 10 articles)",
      }),
    ),
  targetResourceId: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Specific resource ID for targeted achievements (e.g., specific trail or article ID)",
      }),
    ),
  targetAccuracy: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Target accuracy percentage for performance-based achievements",
      }),
    ),
  targetTimeSeconds: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Target time in seconds for time-based achievements",
      }),
    ),
  targetStreakDays: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Target streak in days for streak-based achievements",
      }),
    ),
  requirePerfectScore: (schema) =>
    t.Optional(
      t.Boolean({
        ...schema,
        description: "Whether perfect score is required",
        default: false,
      }),
    ),
  requireSequential: (schema) =>
    t.Optional(
      t.Boolean({
        ...schema,
        description: "Whether actions must be sequential",
        default: false,
      }),
    ),
  badgeIcon: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Lucide icon name for the achievement badge",
        default: "trophy",
      }),
    ),
  badgeColor: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Hex color for the achievement badge",
        default: "#fbbf24",
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
  targetCount: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Target count for count-based achievements (e.g., read 10 articles)",
      }),
    ),
  targetResourceId: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Specific resource ID for targeted achievements (e.g., specific trail or article ID)",
      }),
    ),
  targetAccuracy: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Target accuracy percentage for performance-based achievements",
      }),
    ),
  targetTimeSeconds: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Target time in seconds for time-based achievements",
      }),
    ),
  targetStreakDays: (schema) =>
    t.Optional(
      t.Number({
        ...schema,
        description: "Target streak in days for streak-based achievements",
      }),
    ),
  requirePerfectScore: (schema) =>
    t.Optional(
      t.Boolean({
        ...schema,
        description: "Whether perfect score is required",
      }),
    ),
  requireSequential: (schema) =>
    t.Optional(
      t.Boolean({
        ...schema,
        description: "Whether actions must be sequential",
      }),
    ),
  badgeIcon: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Lucide icon name for the achievement badge",
      }),
    ),
  badgeColor: (schema) =>
    t.Optional(
      t.String({
        ...schema,
        description: "Hex color for the achievement badge",
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
