import { t } from "elysia";
import {
  type Mission,
  type UserMission,
  type UserStreak,
  type UserDailyActivity,
  type StreakMilestone,
  type MissionType,
  type MissionFrequency,
  type MissionStatus,
  missionTypeValues,
  missionFrequencyValues,
  missionStatusValues,
} from "@/db/schema/gamification";

// ============================================================================
// Mission Models
// ============================================================================

export const createMissionBody = t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  description: t.String({ minLength: 1, maxLength: 1000 }),
  type: t.Union(
    missionTypeValues.map((v) => t.Literal(v)) as [
      ReturnType<typeof t.Literal>,
      ...ReturnType<typeof t.Literal>[],
    ],
  ),
  frequency: t.Union(
    missionFrequencyValues.map((v) => t.Literal(v)) as [
      ReturnType<typeof t.Literal>,
      ...ReturnType<typeof t.Literal>[],
    ],
  ),
  status: t.Optional(
    t.Union(
      missionStatusValues.map((v) => t.Literal(v)) as [
        ReturnType<typeof t.Literal>,
        ...ReturnType<typeof t.Literal>[],
      ],
    ),
  ),
  targetValue: t.Number({ minimum: 1 }),
  iconUrl: t.Optional(t.String()),
  validFrom: t.Optional(t.String()),
  validUntil: t.Optional(t.String()),
});

export const updateMissionBody = t.Partial(createMissionBody);

export type CreateMissionBody = typeof createMissionBody.static;
export type UpdateMissionBody = typeof updateMissionBody.static;

// ============================================================================
// Streak Models
// ============================================================================

export const useFreezeBody = t.Object({
  date: t.Optional(t.String({ description: "Date to apply freeze (ISO format)" })),
});

export type UseFreezeBody = typeof useFreezeBody.static;

// ============================================================================
// Activity Models
// ============================================================================

export const recordActivityBody = t.Object({
  type: t.Union([
    t.Literal("question"),
    t.Literal("quiz"),
    t.Literal("article"),
    t.Literal("trail_content"),
    t.Literal("trail_completed"),
    t.Literal("bookmark"),
  ]),
  metadata: t.Optional(
    t.Object({
      questionId: t.Optional(t.Number()),
      quizId: t.Optional(t.Number()),
      articleId: t.Optional(t.Number()),
      trailContentId: t.Optional(t.Number()),
      trailId: t.Optional(t.Number()),
      score: t.Optional(t.Number()),
      timeSpentMinutes: t.Optional(t.Number()),
    }),
  ),
});

export type RecordActivityBody = typeof recordActivityBody.static;

// ============================================================================
// Response Models
// ============================================================================

export interface UserStreakResponse extends UserStreak {
  canUseFreeze: boolean;
  daysUntilNextMilestone: number | null;
  nextMilestone: StreakMilestone | null;
}

export interface UserMissionResponse extends UserMission {
  mission: Mission;
  progressPercentage: number;
}

export interface DailyActivityResponse extends UserDailyActivity {
  hasCompletedActivity: boolean;
}

export interface MissionsOverviewResponse {
  daily: UserMissionResponse[];
  weekly: UserMissionResponse[];
  monthly: UserMissionResponse[];
}

// Export types from schema for convenience
export type {
  Mission,
  UserMission,
  UserStreak,
  UserDailyActivity,
  StreakMilestone,
  MissionType,
  MissionFrequency,
  MissionStatus,
};
