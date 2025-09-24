import { queryOptions } from "@tanstack/react-query";

import type {
  QuestionListQueryParams,
  QuestionListResponse,
} from "../types";

function buildQueryParams(params: QuestionListQueryParams) {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.categoryId) query.set("categoryId", String(params.categoryId));

  if (params.types?.length) {
    for (const type of params.types) {
      query.append("types", type);
    }
  }

  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.status) query.set("status", params.status);
  if (params.authorId) query.set("authorId", params.authorId);

  if (params.tags?.length) {
    query.set("tags", params.tags.join(","));
  }

  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);

  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));
  query.set("sort", params.sort ?? "modified_desc");

  return query;
}

async function fetchQuestions(params: QuestionListQueryParams): Promise<QuestionListResponse> {
  const baseUrl = import.meta.env.VITE_SERVER_URL;

  if (!baseUrl) {
    throw new Error("VITE_SERVER_URL is not defined");
  }

  const url = new URL("/admin/questions", baseUrl);
  const query = buildQueryParams(params);
  url.search = query.toString();

  const response = await fetch(url.toString(), {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    const message = payload?.message ?? "Falha ao carregar as questões";
    const error = new Error(message);
    throw error;
  }

  const result = (await response.json()) as QuestionListResponse;
  return result;
}

export function listQuestionsQueryOptions(params: QuestionListQueryParams) {
  return queryOptions({
    queryKey: ["questions", params] as const,
    queryFn: () => fetchQuestions(params),
    staleTime: 1000 * 30,
  });
}
