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
    onSuccess: () => {
      // Invalidate to fetch the real quiz from server with proper IDs and fields
      queryClient.invalidateQueries({ 
        queryKey: ["quizzes", "list"],
        refetchType: "active"
      });
    },
  });
}

export function useUpdateQuiz(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: QuizUpdateBody) => quizzesApi.updateQuiz(id, body),

    onMutate: async (updatedQuiz) => {
      // Cancel all quiz-related queries
      await queryClient.cancelQueries({ queryKey: ["quizzes"] });

      // Snapshot all list queries (with different params) and detail query
      const previousQueries = queryClient.getQueriesData({ queryKey: ["quizzes", "list"] });
      const previousDetail = queryClient.getQueryData(["quizzes", "detail", id]);

      // Optimistically update ALL list queries
      queryClient.setQueriesData({ queryKey: ["quizzes", "list"] }, (old: any) => {
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

      // Optimistically update the detail query
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

      return { previousQueries, previousDetail, questionsUpdated: !!updatedQuiz.questions };
    },

    onError: (_err, _vars, ctx) => {
      // Rollback all list queries
      if (ctx?.previousQueries) {
        ctx.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // Rollback detail query
      if (ctx?.previousDetail) {
        queryClient.setQueryData(["quizzes", "detail", id], ctx.previousDetail);
      }
    },

    onSuccess: (data, variables, context) => {
      // Guard against null data
      if (!data) return;
      
      // If questions were updated, invalidate to fetch fresh data with new questions
      if (context?.questionsUpdated) {
        queryClient.invalidateQueries({ 
          queryKey: ["quizzes", "detail", id],
          refetchType: "active"
        });
      } else {
        // Only metadata was updated - merge with existing data to preserve questions
        queryClient.setQueryData(["quizzes", "detail", id], (old: any) => {
          if (!old) return data;
          
          // Merge update response with existing detail data
          // Keep questions and other nested data from old cache
          return {
            ...old,
            ...data,
            // Preserve nested data that update endpoint doesn't return
            questions: old.questions,
            author: old.author,
            category: old.category,
          };
        });
      }
      
      // Update ALL list queries - map detail response to list item format
      queryClient.setQueriesData({ queryKey: ["quizzes", "list"] }, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((quiz: any) => {
            if (quiz.id !== id) return quiz;
            
            // Map detail response fields to list item format
            return {
              ...quiz,
              title: data.title,
              description: data.description,
              difficulty: data.difficulty,
              status: data.status,
              categoryId: data.categoryId,
              timeLimit: data.timeLimit,
              maxAttempts: data.maxAttempts,
              passingScore: data.passingScore,
              imageUrl: data.imageUrl,
              updatedAt: data.updatedAt,
              // Update question count if questions were changed
              questionCount: context?.questionsUpdated 
                ? (variables.questions?.length ?? quiz.questionCount)
                : quiz.questionCount,
              author: quiz.author,
              category: quiz.category,
            };
          }),
        };
      });
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
    onSuccess: () => {
      // No invalidation needed - optimistic update already removed the item
      // The cache is consistent with the server state after deletion
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
    onSuccess: (data, quizId) => {
      // Guard against null data
      if (!data) return;
      
      // Update detail query with server response
      queryClient.setQueryData(["quizzes", "detail", quizId], data);
      
      // Update all list queries with archived status - map properly
      queryClient.setQueriesData({ queryKey: ["quizzes", "list"] }, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((quiz: any) => {
            if (quiz.id !== quizId) return quiz;
            
            // Update only the status field, keep other list item fields intact
            return {
              ...quiz,
              status: data.status,
              updatedAt: data.updatedAt,
            };
          }),
        };
      });
      
      // No invalidation needed - cache is already updated with fresh data
    },
  });
}
