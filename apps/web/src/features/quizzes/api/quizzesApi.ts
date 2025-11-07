import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import type { QuizListQueryParams } from "../types";

type QuizCreateBody = {
  title: string;
  description?: string;
  instructions?: string;
  difficulty: "basic" | "intermediate" | "advanced" | "mixed";
  status?: "draft" | "active" | "inactive" | "archived";
  categoryId?: number;
  timeLimit?: number;
  maxAttempts?: number;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  passingScore?: number;
  imageUrl?: string;
  questions?: Array<{
    questionId: number;
    order: number;
    points: number;
    required?: boolean;
  }>;
};

type QuizUpdateBody = {
  title?: string;
  description?: string;
  instructions?: string;
  difficulty?: "basic" | "intermediate" | "advanced" | "mixed";
  status?: "draft" | "active" | "inactive" | "archived";
  categoryId?: number;
  timeLimit?: number;
  maxAttempts?: number;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  passingScore?: number;
  imageUrl?: string;
  questions?: Array<{
    questionId: number;
    order: number;
    points: number;
    required?: boolean;
  }>;
};

export const quizzesApi = {
  listQuizzes: async (params?: QuizListQueryParams) => {
    const response = await client.admin.quizzes.get(
      params ? { query: params as any } : undefined,
    );
    return response.data;
  },

  getQuiz: async (id: number) => {
    const response = await client.admin.quizzes({ id: id.toString() }).get();
    return response.data;
  },

  createQuiz: async (body: QuizCreateBody) => {
    const response = await client.admin.quizzes.post(body as any);
    return response.data;
  },

  updateQuiz: async (id: number, body: QuizUpdateBody) => {
    const response = await client.admin.quizzes({ id: id.toString() }).patch(
      body as any,
    );
    return response.data;
  },

  deleteQuiz: async (id: number) => {
    const response = await client.admin.quizzes({ id: id.toString() }).delete();
    return response.data;
  },

  archiveQuiz: async (id: number) => {
    const response = await client.admin.quizzes({ id: id.toString() }).archive.patch();
    return response.data;
  },
};

export type QuizzesListResponse = Awaited<
  ReturnType<typeof quizzesApi.listQuizzes>
>;

export type Quiz = QuizzesListResponse extends { data: infer D }
  ? D extends Array<infer T>
    ? T
    : never
  : never;

export type QuizDetail = Awaited<ReturnType<typeof quizzesApi.getQuiz>>;

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quizzesApi.createQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useUpdateQuiz(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: QuizUpdateBody) =>
      quizzesApi.updateQuiz(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["quizzes", id] });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quizzesApi.deleteQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useArchiveQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quizzesApi.archiveQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}