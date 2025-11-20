import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTrails,
  fetchTrailById,
  fetchTrailProgress,
  enrollInTrail,
  fetchTrailContent,
  submitTrailQuestion,
  startTrailQuiz,
  submitTrailQuiz,
  markTrailArticleRead,
  fetchRecommendedTrails,
  fetchRecommendedCategories,
} from "./api";
import { gamificationKeys } from "../gamification/hooks";
import { certificateKeys } from "../certificates";

// ============================================================================
// Query Keys
// ============================================================================

export const trailKeys = {
  all: ["trails"] as const,
  lists: () => [...trailKeys.all, "list"] as const,
  list: (filters: string) => [...trailKeys.lists(), { filters }] as const,
  details: () => [...trailKeys.all, "detail"] as const,
  detail: (id: number) => [...trailKeys.details(), id] as const,
  progress: (id: number) => [...trailKeys.all, "progress", id] as const,
  content: (id: number) => [...trailKeys.all, "content", id] as const,
  recommended: () => [...trailKeys.all, "recommended"] as const,
  recommendedCategories: () => [...trailKeys.all, "recommendedCategories"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch list of trails with optional filters
 */
export function useTrails(filters?: {
  difficulty?: string;
  categoryId?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: trailKeys.list(JSON.stringify(filters || {})),
    queryFn: () => fetchTrails(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single trail details
 */
export function useTrail(id: number) {
  return useQuery({
    queryKey: trailKeys.detail(id),
    queryFn: () => fetchTrailById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

/**
 * Fetch user's progress in a trail
 */
export function useTrailProgress(id: number) {
  return useQuery({
    queryKey: trailKeys.progress(id),
    queryFn: () => fetchTrailProgress(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!id,
    retry: false, // Don't retry if not enrolled
  });
}

/**
 * Fetch trail content list
 */
export function useTrailContent(id: number) {
  return useQuery({
    queryKey: trailKeys.content(id),
    queryFn: () => fetchTrailContent(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

/**
 * Fetch recommended trails based on user activity
 */
export function useRecommendedTrails(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: trailKeys.recommended(),
    queryFn: fetchRecommendedTrails,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled,
  });
}

/**
 * Fetch recommended categories based on user activity
 */
export function useRecommendedCategories(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: trailKeys.recommendedCategories(),
    queryFn: fetchRecommendedCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Enroll in a trail
 */
export function useEnrollInTrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enrollInTrail,
    onSuccess: (_, trailId) => {
      // Invalidate trail progress and detail
      queryClient.invalidateQueries({ queryKey: trailKeys.progress(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.detail(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.content(trailId) });
    },
  });
}

/**
 * Submit question answer in trail
 */
export function useSubmitTrailQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trailId,
      questionId,
      data,
    }: {
      trailId: number;
      questionId: number;
      data: {
        answer: number | number[] | string | Record<string, string>;
        timeSpentSeconds?: number;
      };
    }) => submitTrailQuestion(trailId, questionId, data),
    onSuccess: (_, { trailId }) => {
      // Invalidate trail progress, content, and detail
      queryClient.invalidateQueries({ queryKey: trailKeys.progress(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.content(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.detail(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: certificateKeys.user });

      // Invalidate gamification data
      queryClient.invalidateQueries({ queryKey: gamificationKeys.missions() });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.streak() });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.todayActivity(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.weeklyStats(),
      });
    },
  });
}

/**
 * Start quiz in trail
 */
export function useStartTrailQuiz() {
  return useMutation({
    mutationFn: ({
      trailId,
      contentId,
      data,
    }: {
      trailId: number;
      contentId: number;
      data: { ipAddress?: string; userAgent?: string };
    }) => startTrailQuiz(trailId, contentId, data),
  });
}

/**
 * Submit quiz in trail
 */
export function useSubmitTrailQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trailId,
      contentId,
      attemptId,
      data,
    }: {
      trailId: number;
      contentId: number;
      attemptId: number;
      data: {
        answers: Array<{
          quizQuestionId: number;
          selectedOptions?: number[];
          textAnswer?: string;
          matchingAnswers?: Record<string, string>;
          timeSpent?: number;
        }>;
        timeSpent?: number;
      };
    }) => submitTrailQuiz(trailId, contentId, attemptId, data),
    onSuccess: (_, { trailId }) => {
      // Invalidate trail progress, content, and detail
      queryClient.invalidateQueries({ queryKey: trailKeys.progress(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.content(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.detail(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: certificateKeys.user });

      // Invalidate gamification data
      queryClient.invalidateQueries({ queryKey: gamificationKeys.missions() });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.streak() });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.todayActivity(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.weeklyStats(),
      });
    },
  });
}

/**
 * Mark article as read in trail
 */
export function useMarkTrailArticleRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trailId,
      contentId,
    }: {
      trailId: number;
      contentId: number;
    }) => markTrailArticleRead(trailId, contentId),
    onSuccess: (data, { trailId }) => {
      // Invalidate trail progress, content, and detail
      queryClient.invalidateQueries({ queryKey: trailKeys.progress(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.content(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.detail(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.lists() });
      queryClient.invalidateQueries({ queryKey: certificateKeys.user });

      // Invalidate gamification data
      queryClient.invalidateQueries({ queryKey: gamificationKeys.missions() });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.streak() });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.todayActivity(),
      });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.weeklyStats(),
      });

      // Return the data so calling component can check trailJustCompleted
      return data;
    },
  });
}
