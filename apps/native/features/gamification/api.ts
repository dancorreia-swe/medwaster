import { client } from "@/lib/eden";
import type { SuccessResponse } from "@server/lib/responses";
import type {
  UserStreakResponse,
  UserMissionResponse,
  DailyActivityResponse,
  MissionsOverviewResponse,
} from "@server/modules/gamification/model";
import type {
  UserStreak,
  StreakMilestone,
  UserStreakMilestone,
} from "@server/db/schema/gamification";

type UserStreakApiResponse = SuccessResponse<UserStreakResponse>;
type MissionsApiResponse = SuccessResponse<MissionsOverviewResponse>;
type TodayActivityApiResponse = SuccessResponse<DailyActivityResponse>;
type WeeklyStatsApiResponse = SuccessResponse<{
  questionsCompleted: number;
  quizzesCompleted: number;
  articlesRead: number;
  trailContentCompleted: number;
  timeSpentMinutes: number;
  activeDays: number;
}>;

type ActivityHistoryApiResponse = SuccessResponse<
  Array<{
    id: number;
    userId: string;
    activityDate: string;
    questionsCompleted: number;
    quizzesCompleted: number;
    articlesRead: number;
    trailContentCompleted: number;
    timeSpentMinutes: number;
    missionsCompleted: number;
    streakDay: number;
    freezeUsed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>
>;

type MilestonesApiResponse = SuccessResponse<
  Array<{
    userId: string;
    milestoneId: number;
    achievedAt: Date;
    milestone: StreakMilestone;
  }>
>;

function assertSuccess<T>(
  response: { data?: SuccessResponse<T>; error?: unknown } | undefined,
  fallbackMessage: string,
): T {
  if (!response) {
    throw new Error(fallbackMessage);
  }

  if ("error" in response && response.error) {
    const error = response.error as any;
    const message =
      typeof error === "string"
        ? error
        : error?.message ?? fallbackMessage;
    throw new Error(message);
  }

  if (!response.data || response.data.success !== true) {
    throw new Error(fallbackMessage);
  }

  return response.data.data;
}

// ============================================================================
// Streak API
// ============================================================================

export async function fetchUserStreak(): Promise<UserStreakResponse> {
  const response = await client.gamification.streak.get();

  return assertSuccess<UserStreakResponse>(
    response,
    "Não foi possível carregar a sequência.",
  );
}

export async function useStreakFreeze(date?: string): Promise<UserStreak> {
  const response = await client.gamification.streak.freeze.post({
    date,
  });

  return assertSuccess<UserStreak>(
    response,
    "Não foi possível usar o congelamento.",
  );
}

export async function fetchStreakMilestones(): Promise<
  MilestonesApiResponse["data"]
> {
  const response = await client.gamification.streak.milestones.get();

  return assertSuccess<MilestonesApiResponse["data"]>(
    response,
    "Não foi possível carregar as conquistas de sequência.",
  );
}

// ============================================================================
// Missions API
// ============================================================================

export async function fetchUserMissions(): Promise<MissionsOverviewResponse> {
  console.log("📱 [fetchUserMissions] Starting API call...");

  const response = await client.gamification.missions.get();

  console.log("📱 [fetchUserMissions] Raw response:", {
    hasData: !!response?.data,
    hasError: !!response?.error,
    data: response?.data,
    error: response?.error,
  });

  const result = assertSuccess<MissionsOverviewResponse>(
    response,
    "Não foi possível carregar as missões.",
  );

  console.log("📱 [fetchUserMissions] After assertSuccess:", {
    daily: result.daily?.length,
    weekly: result.weekly?.length,
    monthly: result.monthly?.length,
    fullResult: result,
  });

  return result;
}

// ============================================================================
// Activity API
// ============================================================================

export async function fetchTodayActivity(): Promise<DailyActivityResponse> {
  const response = await client.gamification.activity.today.get();

  return assertSuccess<DailyActivityResponse>(
    response,
    "Não foi possível carregar a atividade de hoje.",
  );
}

export async function fetchWeeklyStats(): Promise<
  WeeklyStatsApiResponse["data"]
> {
  const response = await client.gamification.activity.weekly.get();

  return assertSuccess<WeeklyStatsApiResponse["data"]>(
    response,
    "Não foi possível carregar as estatísticas semanais.",
  );
}

export async function fetchActivityHistory(
  days: number = 30,
): Promise<ActivityHistoryApiResponse["data"]> {
  const response = await client.gamification.activity.history.get({
    query: { days },
  });

  return assertSuccess<ActivityHistoryApiResponse["data"]>(
    response,
    "Não foi possível carregar o histórico de atividades.",
  );
}

export async function recordActivity(data: {
  type: "question" | "quiz" | "article" | "trail_content" | "bookmark";
  metadata?: {
    questionId?: number;
    quizId?: number;
    articleId?: number;
    trailContentId?: number;
    score?: number;
    timeSpentMinutes?: number;
  };
}): Promise<DailyActivityResponse> {
  const response = await client.gamification.activity.record.post(data);

  return assertSuccess<DailyActivityResponse>(
    response,
    "Não foi possível registrar a atividade.",
  );
}
