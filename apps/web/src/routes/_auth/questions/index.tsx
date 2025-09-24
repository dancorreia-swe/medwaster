import { useMemo } from "react";

import { listQuestionsQueryOptions } from "@/features/questions/api/list-questions";
import { QuestionsFilters } from "@/features/questions/components/questions-filters";
import type { FilterState } from "@/features/questions/components/questions-filters";
import { QuestionsTable } from "@/features/questions/components/questions-table";
import {
  QUESTION_DIFFICULTIES,
  QUESTION_SORT_OPTIONS,
  QUESTION_STATUS,
  QUESTION_TYPES,
} from "@/features/questions/types";
import type {
  QuestionDifficulty,
  QuestionListQueryParams,
  QuestionSortOption,
  QuestionStatus,
  QuestionType,
} from "@/features/questions/types";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  types: z.array(z.string()).optional().default([]),
  difficulty: z.string().optional(),
  status: z.string().optional(),
  tags: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().min(1).catch(1),
  pageSize: z.number().int().min(1).max(50).catch(10),
  sort: z.string().catch("modified_desc"),
});

export const Route = createFileRoute("/_auth/questions/")({
  validateSearch: searchSchema,
  component: QuestionsRoute,
});

function QuestionsRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const filtersValue = useMemo<FilterState>(() => ({
    q: search.q ?? "",
    types: search.types?.filter(isQuestionType) ?? [],
    difficulty: isQuestionDifficulty(search.difficulty) ? search.difficulty : "",
    status: isQuestionStatus(search.status) ? search.status : "",
    tags: search.tags ?? "",
    dateFrom: search.dateFrom ?? "",
    dateTo: search.dateTo ?? "",
    sort: isSortOption(search.sort) ? search.sort : "modified_desc",
  }), [search]);

  const queryParams = useMemo<QuestionListQueryParams>(() => ({
    q: search.q ?? undefined,
    types: search.types?.filter(isQuestionType) ?? [],
    difficulty: isQuestionDifficulty(search.difficulty) ? search.difficulty : undefined,
    status: isQuestionStatus(search.status) ? search.status : undefined,
    tags: search.tags
      ? search.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined,
    dateFrom: search.dateFrom ?? undefined,
    dateTo: search.dateTo ?? undefined,
    page: search.page,
    pageSize: search.pageSize,
    sort: isSortOption(search.sort) ? search.sort : "modified_desc",
  }), [search]);

  const query = useQuery(listQuestionsQueryOptions(queryParams));

  const data = query.data?.data ?? [];
  const meta = query.data?.meta ?? {
    page: search.page,
    pageSize: search.pageSize,
    total: 0,
    totalPages: 1,
  };
  const error = query.error instanceof Error ? query.error : query.error ? new Error("Erro inesperado") : null;

  function handleApplyFilters(value: FilterState) {
    navigate({
      search: (prev) => ({
        ...prev,
        q: value.q ? value.q : undefined,
        types: value.types,
        difficulty: value.difficulty ? value.difficulty : undefined,
        status: value.status ? value.status : undefined,
        tags: value.tags ? value.tags : undefined,
        dateFrom: value.dateFrom ? value.dateFrom : undefined,
        dateTo: value.dateTo ? value.dateTo : undefined,
        sort: value.sort,
        page: 1,
      }),
      replace: true,
    });
  }

  function handleResetFilters() {
    navigate({
      search: (prev) => ({
        ...prev,
        q: undefined,
        types: [],
        difficulty: undefined,
        status: undefined,
        tags: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        sort: "modified_desc" as const,
        page: 1,
      }),
      replace: true,
    });
  }

  function handlePageChange(page: number) {
    navigate({
      search: (prev) => ({
        ...prev,
        page,
      }),
      replace: true,
    });
  }

  function handlePageSizeChange(size: number) {
    navigate({
      search: (prev) => ({
        ...prev,
        pageSize: size,
        page: 1,
      }),
      replace: true,
    });
  }

  return (
    <div className="space-y-6 py-4">
      <QuestionsFilters value={filtersValue} onSubmit={handleApplyFilters} onReset={handleResetFilters} />

      <QuestionsTable
        data={data}
        meta={meta}
        isLoading={query.isLoading}
        error={error}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={search.pageSize}
      />
    </div>
  );
}

const questionTypeSet = new Set<QuestionType>(QUESTION_TYPES);
const questionDifficultySet = new Set<QuestionDifficulty>(QUESTION_DIFFICULTIES);
const questionStatusSet = new Set<QuestionStatus>(QUESTION_STATUS);
const sortSet = new Set<QuestionSortOption>(QUESTION_SORT_OPTIONS);

function isQuestionType(value?: string | null): value is QuestionType {
  return !!value && questionTypeSet.has(value as QuestionType);
}

function isQuestionDifficulty(value?: string | null): value is QuestionDifficulty {
  return !!value && questionDifficultySet.has(value as QuestionDifficulty);
}

function isQuestionStatus(value?: string | null): value is QuestionStatus {
  return !!value && questionStatusSet.has(value as QuestionStatus);
}

function isSortOption(value?: string | null): value is QuestionSortOption {
  return !!value && sortSet.has(value as QuestionSortOption);
}
