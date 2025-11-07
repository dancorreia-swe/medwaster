import { queryOptions } from "@tanstack/react-query";
import { questionsApi } from "./questionsApi";
import type { QuestionListQueryParams } from "../types";

export const questionsQueryKeys = {
  all: ["questions"] as const,
  lists: () => [...questionsQueryKeys.all, "list"] as const,
  list: (params?: QuestionListQueryParams) =>
    [...questionsQueryKeys.lists(), params] as const,
  details: () => [...questionsQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...questionsQueryKeys.details(), id] as const,
};

export const questionsListQueryOptions = (params?: QuestionListQueryParams) =>
  queryOptions({
    queryKey: questionsQueryKeys.list(params),
    queryFn: () => questionsApi.listQuestions(params),
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000, // 10 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

export const questionQueryOptions = (id: number) =>
  queryOptions({
    queryKey: questionsQueryKeys.detail(id),
    queryFn: () => questionsApi.getQuestion(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 5 * 60_000,
  });
