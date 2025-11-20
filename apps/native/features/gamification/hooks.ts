import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import {
  fetchUserStreak,
  fetchUserMissions,
  fetchTodayActivity,
  fetchWeeklyStats,
  fetchActivityHistory,
  fetchStreakMilestones,
  useStreakFreeze,
  recordActivity,
} from "./api";
import type {
  UserStreakResponse,
  MissionsOverviewResponse,
  DailyActivityResponse,
} from "@server/modules/gamification/model";

// ============================================================================
// Query Keys
// ============================================================================

export const gamificationKeys = {
  all: ["gamification"] as const,
  streak: () => [...gamificationKeys.all, "streak"] as const,
  streakMilestones: () =>
    [...gamificationKeys.all, "streak", "milestones"] as const,
  missions: () => [...gamificationKeys.all, "missions"] as const,
  todayActivity: () => [...gamificationKeys.all, "activity", "today"] as const,
  weeklyStats: () => [...gamificationKeys.all, "activity", "weekly"] as const,
  activityHistory: (days?: number) =>
    [...gamificationKeys.all, "activity", "history", days] as const,
};

// ============================================================================
// Streak Hooks
// ============================================================================

export function useUserStreak() {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.streak(),
    queryFn: fetchUserStreak,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useStreakMilestones() {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.streakMilestones(),
    queryFn: fetchStreakMilestones,
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useUseStreakFreeze() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date?: string) => useStreakFreeze(date),
    onSuccess: (data) => {
      // Update streak cache optimistically
      queryClient.setQueryData<UserStreakResponse>(
        gamificationKeys.streak(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            ...data,
            freezesAvailable: data.freezesAvailable,
            freezesUsed: data.freezesUsed,
            canUseFreeze: data.freezesAvailable > 0,
          };
        },
      );
    },
    onSettled: () => {
      // Invalidate to refetch from server
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.streak(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.todayActivity(),
      });
    },
  });
}

// ============================================================================
// Missions Hooks
// ============================================================================

export function useUserMissions() {
  const { data: session, isPending } = authClient.useSession();

  const query = useQuery({
    queryKey: gamificationKeys.missions(),
    queryFn: fetchUserMissions,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!session && !isPending,
    retry: false,
  });

  console.log("📱 [useUserMissions] Hook state:", {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    hasData: !!query.data,
    daily: query.data?.daily?.length,
    weekly: query.data?.weekly?.length,
    monthly: query.data?.monthly?.length,
  });

  return query;
}

// ============================================================================
// Activity Hooks
// ============================================================================

export function useTodayActivity() {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.todayActivity(),
    queryFn: fetchTodayActivity,
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useWeeklyStats() {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.weeklyStats(),
    queryFn: fetchWeeklyStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useActivityHistory(days: number = 30) {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.activityHistory(days),
    queryFn: () => fetchActivityHistory(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useRecordActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordActivity,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: gamificationKeys.todayActivity(),
      });

      // Snapshot previous value
      const previousActivity =
        queryClient.getQueryData<DailyActivityResponse>(
          gamificationKeys.todayActivity(),
        );

      // Optimistically update today's activity
      queryClient.setQueryData<DailyActivityResponse>(
        gamificationKeys.todayActivity(),
        (old) => {
          if (!old) return old;

          const updates: Partial<DailyActivityResponse> = {};

          switch (variables.type) {
            case "question":
              updates.questionsCompleted = old.questionsCompleted + 1;
              break;
            case "quiz":
              updates.quizzesCompleted = old.quizzesCompleted + 1;
              break;
            case "article":
              updates.articlesRead = old.articlesRead + 1;
              break;
            case "trail_content":
              updates.trailContentCompleted = old.trailContentCompleted + 1;
              break;
          }

          if (variables.metadata?.timeSpentMinutes) {
            updates.timeSpentMinutes =
              old.timeSpentMinutes + variables.metadata.timeSpentMinutes;
          }

          return {
            ...old,
            ...updates,
            hasCompletedActivity: true,
          };
        },
      );

      return { previousActivity };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousActivity) {
        queryClient.setQueryData(
          gamificationKeys.todayActivity(),
          context.previousActivity,
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.todayActivity(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.weeklyStats(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.streak(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.missions(),
      });
    },
  });
}
