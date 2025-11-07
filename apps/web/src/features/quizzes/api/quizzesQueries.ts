import { queryOptions } from "@tanstack/react-query";
import { quizzesApi } from "./quizzesApi";
import type { QuizListQueryParams } from "../types";

export const quizzesQueryKeys = {
  all: ["quizzes"] as const,
  lists: () => [...quizzesQueryKeys.all, "list"] as const,
  list: (params?: QuizListQueryParams) =>
    [...quizzesQueryKeys.lists(), params] as const,
  details: () => [...quizzesQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...quizzesQueryKeys.details(), id] as const,
};

export const quizzesListQueryOptions = (params?: QuizListQueryParams) =>
  queryOptions({
    queryKey: quizzesQueryKeys.list(params),
    queryFn: () => quizzesApi.listQuizzes(params),
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000, // 10 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

export const quizQueryOptions = (id: number) =>
  queryOptions({
    queryKey: quizzesQueryKeys.detail(id),
    queryFn: () => quizzesApi.getQuiz(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 5 * 60_000,
  });