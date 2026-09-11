import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
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
  streak: (userId?: string) =>
    userId
      ? ([...gamificationKeys.all, "streak", userId] as const)
      : ([...gamificationKeys.all, "streak"] as const),
  streakMilestones: (userId?: string) =>
    userId
      ? ([...gamificationKeys.all, "streak", "milestones", userId] as const)
      : ([...gamificationKeys.all, "streak", "milestones"] as const),
  missions: (userId?: string) =>
    userId
      ? ([...gamificationKeys.all, "missions", userId] as const)
      : ([...gamificationKeys.all, "missions"] as const),
  todayActivity: (userId?: string) =>
    userId
      ? ([...gamificationKeys.all, "activity", "today", userId] as const)
      : ([...gamificationKeys.all, "activity", "today"] as const),
  weeklyStats: (userId?: string) =>
    userId
      ? ([...gamificationKeys.all, "activity", "weekly", userId] as const)
      : ([...gamificationKeys.all, "activity", "weekly"] as const),
  activityHistory: (days?: number, userId?: string) =>
    userId
      ? ([
          ...gamificationKeys.all,
          "activity",
          "history",
          days,
          userId,
        ] as const)
      : ([...gamificationKeys.all, "activity", "history", days] as const),
};

// ============================================================================
// Streak Hooks
// ============================================================================

export function useUserStreak() {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.streak(session?.user.id),
    queryFn: fetchUserStreak,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useStreakMilestones() {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.streakMilestones(session?.user.id),
    queryFn: fetchStreakMilestones,
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useUseStreakFreeze() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  return useMutation({
    mutationFn: (date?: string) => useStreakFreeze(date),
    onSuccess: (data) => {
      // Update streak cache optimistically
      queryClient.setQueryData<UserStreakResponse>(
        gamificationKeys.streak(session?.user.id),
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
        queryKey: gamificationKeys.streak(session?.user.id),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.todayActivity(session?.user.id),
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
    queryKey: gamificationKeys.missions(session?.user.id),
    queryFn: fetchUserMissions,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!session && !isPending,
    retry: false,
  });

  const enabled = !!session && !isPending;
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (enabled) void refetch();
    }, [enabled, refetch]),
  );

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const scheduleReset = () => {
      clearTimeout(timer);
      const now = new Date();
      const midnight = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
      );
      timer = setTimeout(
        () => {
          void refetch();
          scheduleReset();
        },
        midnight - now.getTime() + 100,
      );
    };
    scheduleReset();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refetch();
        scheduleReset();
      }
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [enabled, refetch]);

  return query;
}

// ============================================================================
// Activity Hooks
// ============================================================================

export function useTodayActivity() {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.todayActivity(session?.user.id),
    queryFn: fetchTodayActivity,
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useWeeklyStats() {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.weeklyStats(session?.user.id),
    queryFn: fetchWeeklyStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useActivityHistory(days: number = 30) {
  const { data: session, isPending } = authClient.useSession();

  return useQuery({
    queryKey: gamificationKeys.activityHistory(days, session?.user.id),
    queryFn: () => fetchActivityHistory(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!session && !isPending,
    retry: false,
  });
}

export function useRecordActivity() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: recordActivity,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: gamificationKeys.todayActivity(userId),
      });

      // Snapshot previous value
      const previousActivity = queryClient.getQueryData<DailyActivityResponse>(
        gamificationKeys.todayActivity(userId),
      );

      // Optimistically update today's activity
      queryClient.setQueryData<DailyActivityResponse>(
        gamificationKeys.todayActivity(userId),
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
          gamificationKeys.todayActivity(userId),
          context.previousActivity,
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.todayActivity(userId),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.weeklyStats(userId),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.streak(userId),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.missions(userId),
      });
    },
  });
}
