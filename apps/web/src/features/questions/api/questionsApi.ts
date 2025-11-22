import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import type { QuestionListQueryParams } from "../types";

type QuestionReference = {
  title: string;
  url?: string;
  type: "book" | "article" | "website" | "other";
};

type QuestionCreateBody = {
  prompt: string;
  type: "multiple_choice" | "true_false" | "fill_in_the_blank" | "matching";
  difficulty: "basic" | "intermediate" | "advanced";
  explanation?: string;
  status?: "draft" | "active" | "inactive" | "archived";
  categoryId?: number | null;
  imageUrl?: string;
  imageKey?: string | null;
  references?: QuestionReference[];
  options?: Array<{
    label: string;
    content: string;
    isCorrect: boolean;
  }>;
  fillInBlanks?: Array<{
    sequence: number;
    placeholder?: string;
    answer?: string;
    options?: Array<{
      text: string;
      isCorrect: boolean;
    }>;
  }>;
  matchingPairs?: Array<{
    leftText: string;
    rightText: string;
    sequence: number;
  }>;
  tagIds?: number[];
};

type QuestionUpdateBody = {
  prompt?: string;
  type?: "multiple_choice" | "true_false" | "fill_in_the_blank" | "matching";
  difficulty?: "basic" | "intermediate" | "advanced";
  explanation?: string;
  status?: "draft" | "active" | "inactive" | "archived";
  categoryId?: number | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  references?: QuestionReference[];
  options?: Array<{
    label: string;
    content: string;
    isCorrect: boolean;
  }>;
  fillInBlanks?: Array<{
    sequence: number;
    placeholder?: string;
    answer?: string;
    options?: Array<{
      text: string;
      isCorrect: boolean;
    }>;
  }>;
  matchingPairs?: Array<{
    leftText: string;
    rightText: string;
    sequence: number;
  }>;
  tagIds?: number[];
};

export const questionsApi = {
  listQuestions: async (params?: QuestionListQueryParams) => {
    const response = await client.admin.questions.get(
      params ? { query: params as any } : undefined,
    );
    return response.data;
  },

  getQuestion: async (id: number) => {
    const response = await client.admin.questions({ id: id.toString() }).get();
    return response.data;
  },

  createQuestion: async (body: QuestionCreateBody) => {
    const response = await client.admin.questions.post(body as any);
    return response.data;
  },

  updateQuestion: async (id: number, body: QuestionUpdateBody) => {
    const response = await client.admin.questions({ id: id.toString() }).patch(
      body as any,
    );
    return response.data;
  },

  deleteQuestion: async (id: number) => {
    const response = await client.admin.questions({ id: id.toString() }).delete();
    return response.data;
  },
};

export type QuestionsListResponse = Awaited<
  ReturnType<typeof questionsApi.listQuestions>
>;

export type Question = QuestionsListResponse extends { data: infer D }
  ? D extends Array<infer T>
    ? T
    : never
  : never;

export type QuestionDetail = Awaited<ReturnType<typeof questionsApi.getQuestion>>;

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: questionsApi.createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useUpdateQuestion(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: QuestionUpdateBody) =>
      questionsApi.updateQuestion(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["questions", id] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: questionsApi.deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}
