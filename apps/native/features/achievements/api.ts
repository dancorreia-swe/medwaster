import { client } from "@/lib/eden";
import type { SuccessResponse } from "@server/lib/responses";

export type Achievement = {
  id: number;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  difficulty: string;
  type: string;
  status: string;
  visibility: string;
  badgeIcon: string;
  badgeColor: string;
  badgeImageUrl?: string;
  badgeSvg?: string;
  triggerType: string;
  targetCount?: number;
  targetResourceId?: string;
  targetAccuracy?: number;
  targetTimeSeconds?: number;
  targetStreakDays?: number;
  requirePerfectScore: boolean;
  requireSequential: boolean;
  isSecret: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  // User progress fields
  isUnlocked: boolean;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  unlockedAt: Date | null;
};

type AchievementsApiResponse = SuccessResponse<Achievement[]>;

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

/**
 * Fetch all visible achievements (active and public)
 */
export async function fetchAchievements(): Promise<Achievement[]> {
  const response = await client.achievements.get();

  return assertSuccess<Achievement[]>(
    response,
    "Não foi possível carregar as conquistas.",
  );
}
