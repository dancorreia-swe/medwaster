import { t } from "elysia";

// Custom schema - API accepts flat structure that gets transformed into nested DB structure
export const createAchievementBody = t.Object({
  name: t.String({
    description: "Unique name/title of the achievement",
    minLength: 1,
    maxLength: 255,
  }),
  description: t.String({
    description: "Detailed description of the achievement and how to unlock it",
    maxLength: 500,
  }),
  category: t.Union([
    t.Literal("trails"),
    t.Literal("wiki"),
    t.Literal("questions"),
    t.Literal("certification"),
    t.Literal("engagement"),
    t.Literal("general"),
  ], {
    description: "Category of the achievement",
  }),
  difficulty: t.Optional(
    t.Union([t.Literal("easy"), t.Literal("medium"), t.Literal("hard")], {
      description: "Difficulty level of the achievement",
      default: "medium",
    }),
  ),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("active"),
      t.Literal("inactive"),
      t.Literal("archived"),
    ], {
      description: "Status of the achievement",
      default: "active",
    }),
  ),
  triggerType: t.String({
    description: "Type of event that triggers this achievement",
  }),
  targetCount: t.Optional(
    t.Number({
      description: "Target count for count-based achievements (e.g., read 10 articles)",
    }),
  ),
  targetResourceId: t.Optional(
    t.String({
      description: "Specific resource ID for targeted achievements (e.g., specific trail or article ID)",
    }),
  ),
  targetAccuracy: t.Optional(
    t.Number({
      description: "Target accuracy percentage for performance-based achievements",
    }),
  ),
  targetTimeSeconds: t.Optional(
    t.Number({
      description: "Target time in seconds for time-based achievements",
    }),
  ),
  targetStreakDays: t.Optional(
    t.Number({
      description: "Target streak in days for streak-based achievements",
    }),
  ),
  requirePerfectScore: t.Optional(
    t.Boolean({
      description: "Whether perfect score is required",
      default: false,
    }),
  ),
  requireSequential: t.Optional(
    t.Boolean({
      description: "Whether actions must be sequential",
      default: false,
    }),
  ),
  badgeIcon: t.String({
    description: "Lucide icon name for the achievement badge",
    default: "trophy",
  }),
  badgeColor: t.String({
    description: "Hex color for the achievement badge",
    default: "#fbbf24",
  }),
  badgeImageUrl: t.Optional(
    t.String({
      description: "URL to the achievement badge image",
    }),
  ),
  customMessage: t.Optional(
    t.String({
      description: "Custom message displayed when achievement is unlocked",
    }),
  ),
  displayOrder: t.Optional(
    t.Number({
      description: "Display order for sorting achievements",
      default: 0,
    }),
  ),
  isSecret: t.Optional(
    t.Boolean({
      description: "Whether the achievement is hidden until unlocked (secret achievement)",
      default: false,
    }),
  ),
});

export type CreateAchievementBody = typeof createAchievementBody.static;

export const updateAchievementBody = t.Object({
  name: t.Optional(
    t.String({
      description: "Unique name/title of the achievement",
      minLength: 1,
      maxLength: 255,
    }),
  ),
  description: t.Optional(
    t.String({
      description: "Detailed description of the achievement and how to unlock it",
      maxLength: 500,
    }),
  ),
  category: t.Optional(
    t.Union([
      t.Literal("trails"),
      t.Literal("wiki"),
      t.Literal("questions"),
      t.Literal("certification"),
      t.Literal("engagement"),
      t.Literal("general"),
    ], {
      description: "Category of the achievement",
    }),
  ),
  difficulty: t.Optional(
    t.Union([t.Literal("easy"), t.Literal("medium"), t.Literal("hard")], {
      description: "Difficulty level of the achievement",
    }),
  ),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("active"),
      t.Literal("inactive"),
      t.Literal("archived"),
    ], {
      description: "Status of the achievement",
    }),
  ),
  triggerType: t.Optional(
    t.String({
      description: "Type of event that triggers this achievement",
    }),
  ),
  targetCount: t.Optional(
    t.Number({
      description: "Target count for count-based achievements",
    }),
  ),
  targetResourceId: t.Optional(
    t.String({
      description: "Specific resource ID for targeted achievements",
    }),
  ),
  targetAccuracy: t.Optional(
    t.Number({
      description: "Target accuracy percentage for performance-based achievements",
    }),
  ),
  targetTimeSeconds: t.Optional(
    t.Number({
      description: "Target time in seconds for time-based achievements",
    }),
  ),
  targetStreakDays: t.Optional(
    t.Number({
      description: "Target streak in days for streak-based achievements",
    }),
  ),
  requirePerfectScore: t.Optional(
    t.Boolean({
      description: "Whether perfect score is required",
    }),
  ),
  requireSequential: t.Optional(
    t.Boolean({
      description: "Whether actions must be sequential",
    }),
  ),
  badgeIcon: t.Optional(
    t.String({
      description: "Lucide icon name for the achievement badge",
    }),
  ),
  badgeColor: t.Optional(
    t.String({
      description: "Hex color for the achievement badge",
    }),
  ),
  badgeImageUrl: t.Optional(
    t.String({
      description: "URL to the achievement badge image",
    }),
  ),
  customMessage: t.Optional(
    t.String({
      description: "Custom message displayed when achievement is unlocked",
    }),
  ),
  displayOrder: t.Optional(
    t.Number({
      description: "Display order for sorting achievements",
    }),
  ),
  isSecret: t.Optional(
    t.Boolean({
      description: "Whether the achievement is hidden until unlocked",
    }),
  ),
});

export type UpdateAchievementBody = typeof updateAchievementBody.static;
