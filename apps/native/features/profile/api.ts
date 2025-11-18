import { client } from "@/lib/eden";
import type { SuccessResponse } from "@server/lib/responses";

export interface ProfileStats {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    role: string | null;
    banned: boolean;
    banReason: string | null;
    banExpires: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  stats: {
    achievements: {
      tracked: number;
      unlocked: number;
      inProgress: number;
      averageProgress: number;
    };
    trails: {
      enrolled: number;
      completed: number;
      timeSpentMinutes: number;
      lastAccessedAt: Date | null;
    };
    quizzes: {
      attempts: number;
      passed: number;
      averageScore: number;
      timeSpentSeconds: number;
      lastAttemptAt: Date | null;
    };
    questions: {
      totalAttempts: number;
      uniqueQuestions: number;
      correctAnswers: number;
      lastAttemptAt: Date | null;
    };
    lastActivityAt: Date | null;
  };
}

type ProfileStatsApiResponse = SuccessResponse<ProfileStats>;

export async function fetchProfileStats(): Promise<ProfileStats> {
  const response = await client.profile.stats.get();

  if (response.error || !response.data) {
    throw new Error(response.error?.value as string || "Failed to fetch profile stats");
  }

  const apiResponse = response.data as ProfileStatsApiResponse;

  if (!apiResponse.success) {
    throw new Error("Failed to fetch profile stats");
  }

  return apiResponse.data;
}
