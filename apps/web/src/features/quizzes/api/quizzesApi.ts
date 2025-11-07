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
    onMutate: async (newQuiz) => {
      await queryClient.cancelQueries({ queryKey: ["quizzes", "list"] });

      const previousQuizzes = queryClient.getQueriesData({ queryKey: ["quizzes", "list"] });

      queryClient.setQueriesData({ queryKey: ["quizzes", "list"] }, (old: any) => {
        if (!old?.data) return old;

        const optimisticQuiz = {
          id: Date.now(), // Temporary ID
          ...newQuiz,
          questionCount: newQuiz.questions?.length || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: { id: "current-user", name: "You", image: null },
          category: null,
        };

        return {
          ...old,
          data: [optimisticQuiz, ...old.data],
          meta: {
            ...old.meta,
            total: old.meta.total + 1,
          },
        };
      });

      return { previousQuizzes };
    },
    onError: (_err, _newQuiz, context) => {
      if (context?.previousQuizzes) {
        context.previousQuizzes.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useUpdateQuiz(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: QuizUpdateBody) => quizzesApi.updateQuiz(id, body),

    onMutate: async (updatedQuiz) => {
      await queryClient.cancelQueries({ queryKey: ["quizzes"] });

      const previousList = queryClient.getQueryData(["quizzes", "list"]);
      const previousDetail = queryClient.getQueryData(["quizzes", "detail", id]);

      // Optimistically update the list
      queryClient.setQueryData(["quizzes", "list"], (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((quiz: any) =>
            quiz.id === id
              ? {
                  ...quiz,
                  ...updatedQuiz,
                  questionCount: updatedQuiz.questions?.length ?? quiz.questionCount,
                  updatedAt: new Date().toISOString(),
                }
              : quiz
          ),
        };
      });

      // Optimistically update the detail
      queryClient.setQueryData(["quizzes", "detail", id], (old: any) => {
        if (!old) return old;

        const { questions: updatedQuestions, ...quizUpdates } = updatedQuiz;

        let questions = old.questions;
        if (updatedQuestions) {
          const existingMap = new Map(
            (old.questions || []).map((q: any) => [q.questionId, q])
          );

          questions = updatedQuestions
            .map((uq: any) => {
              const existingQ = existingMap.get(uq.questionId);
              if (existingQ) {
                return { ...existingQ, ...uq };
              }
              return null;
            })
            .filter(Boolean);
        }

        return {
          ...old,
          ...quizUpdates,
          questions,
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousList, previousDetail };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousList)
        queryClient.setQueryData(["quizzes", "list"], ctx.previousList);
      if (ctx?.previousDetail)
        queryClient.setQueryData(["quizzes", "detail", id], ctx.previousDetail);
    },

    onSuccess: (data) => {
      // Use backend response to finalize cache, without refetch
      queryClient.setQueryData(["quizzes", "detail", id], data);
      queryClient.setQueryData(["quizzes", "list"], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((quiz: any) =>
            quiz.id === id ? data : quiz
          ),
        };
      });
    },

    onSettled: () => {
      // Optional — lightweight background refresh, if needed
      // queryClient.invalidateQueries({ queryKey: ["quizzes", "list"], refetchType: "inactive" });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quizzesApi.deleteQuiz,
    onMutate: async (quizId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["quizzes", "list"] });

      // Snapshot previous value
      const previousQuizzes = queryClient.getQueriesData({ queryKey: ["quizzes", "list"] });

      // Optimistically remove from all list queries
      queryClient.setQueriesData({ queryKey: ["quizzes", "list"] }, (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.filter((quiz: any) => quiz.id !== quizId),
          meta: {
            ...old.meta,
            total: Math.max(0, old.meta.total - 1),
          },
        };
      });

      return { previousQuizzes };
    },
    onError: (_err, _quizId, context) => {
      // Rollback on error
      if (context?.previousQuizzes) {
        context.previousQuizzes.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}

export function useArchiveQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quizzesApi.archiveQuiz,
    onMutate: async (quizId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["quizzes"] });

      // Snapshot previous values
      const previousQuizzes = queryClient.getQueriesData({ queryKey: ["quizzes", "list"] });
      const previousQuiz = queryClient.getQueryData(["quizzes", "detail", quizId]);

      // Optimistically update status in all list queries
      queryClient.setQueriesData({ queryKey: ["quizzes", "list"] }, (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((quiz: any) =>
            quiz.id === quizId
              ? {
                  ...quiz,
                  status: "archived" as const,
                  updatedAt: new Date().toISOString(),
                }
              : quiz
          ),
        };
      });

      // Optimistically update detail query
      queryClient.setQueryData(["quizzes", "detail", quizId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: "archived" as const,
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousQuizzes, previousQuiz };
    },
    onError: (_err, quizId, context) => {
      // Rollback on error
      if (context?.previousQuizzes) {
        context.previousQuizzes.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousQuiz) {
        queryClient.setQueryData(["quizzes", "detail", quizId], context.previousQuiz);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    },
  });
}
