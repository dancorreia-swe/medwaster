import { z } from "zod";

import {
  questionDifficultyValues,
  questionStatusValues,
  questionTypeValues,
} from "@/db/schema/questions";

export const sortOptionValues = [
  "modified_desc",
  "created_desc",
  "name_asc",
  "category_asc",
] as const;

export type SortOption = (typeof sortOptionValues)[number];
export type QuestionType = (typeof questionTypeValues)[number];
export type QuestionDifficulty = (typeof questionDifficultyValues)[number];
export type QuestionStatus = (typeof questionStatusValues)[number];

export interface ListQuestionsParams {
  q?: string;
  categoryId?: number;
  types: QuestionType[];
  difficulty?: QuestionDifficulty;
  tags: string[];
  status?: QuestionStatus;
  authorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  pageSize: number;
  sort: SortOption;
}

export const listQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    categoryId: z.union([z.string(), z.number()]).optional(),
    types: z.union([z.string(), z.array(z.string())]).optional(),
    difficulty: z.string().optional(),
    tags: z.string().optional(),
    status: z.string().optional(),
    authorId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().int().gte(1).optional(),
    pageSize: z.coerce.number().int().gte(1).lte(50).optional(),
    sort: z.string().optional(),
  })
  .optional()
  .default({});

export function normalizeListParams(input: z.infer<typeof listQuerySchema>): ListQuestionsParams {
  const q = input?.q ? input.q : undefined;

  const categoryId = input?.categoryId
    ? Number(input.categoryId)
    : undefined;

  const typesSet = new Set<QuestionType>(questionTypeValues);
  const types = normalizeMultiValue(input?.types)
    .map((value) => value.toLowerCase() as QuestionType)
    .filter((value): value is QuestionType => typesSet.has(value));

  const difficulty = input?.difficulty as QuestionDifficulty | undefined;
  const validDifficulty = difficulty && isOneOf(difficulty, questionDifficultyValues)
    ? difficulty
    : undefined;

  const status = input?.status as QuestionStatus | undefined;
  const validStatus = status && isOneOf(status, questionStatusValues) ? status : undefined;

  const tagsValues = input?.tags
    ? input.tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const dateFrom = parseDate(input?.dateFrom);
  const dateTo = parseDate(input?.dateTo, { endOfDay: true });

  const page = normalizePage(input?.page);
  const pageSize = normalizePageSize(input?.pageSize);

  const sort = normalizeSort(input?.sort);

  return {
    q,
    categoryId,
    types,
    difficulty: validDifficulty,
    tags: tagsValues,
    status: validStatus,
    authorId: input?.authorId ?? undefined,
    dateFrom,
    dateTo,
    page,
    pageSize,
    sort,
  };
}

function normalizeMultiValue(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => `${item}`.trim()).filter(Boolean);
  if (typeof value === "string") {
    if (value.includes(",")) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return value ? [value.trim()] : [];
  }
  return [];
}

function parseDate(value?: string, options?: { endOfDay?: boolean }) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (options?.endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

function normalizePage(value: number | undefined) {
  if (!value || value < 1) return 1;
  return value;
}

function normalizePageSize(value: number | undefined) {
  const allowed = new Set([10, 20, 50]);
  if (!value || !allowed.has(value)) return 10;
  return value;
}

function normalizeSort(value: string | undefined): SortOption {
  if (!value) return "modified_desc";
  const lower = value.toLowerCase() as SortOption;
  if ((sortOptionValues as readonly string[]).includes(lower)) {
    return lower;
  }
  return "modified_desc";
}

function isOneOf<T extends readonly string[]>(value: string, options: T): value is T[number] {
  return (options as readonly string[]).includes(value);
}
