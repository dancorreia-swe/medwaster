import {
  SQL,
  and,
  asc,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  questionTags,
  questions,
  tags,
} from "@/db/schema/questions";
import { contentCategories } from "@/db/schema/categories";
import { user } from "@/db/schema/auth";

import type { ListQuestionsParams, SortOption } from "./questions.validators";

export interface QuestionListItem {
  id: number;
  prompt: string;
  type: string;
  difficulty: string;
  status: string;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  author: {
    id: string;
    name: string;
  } | null;
  tags: {
    id: number;
    name: string;
    slug: string;
    color: string | null;
  }[];
  usageCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ListQuestionsResult {
  data: QuestionListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function listQuestions(params: ListQuestionsParams): Promise<ListQuestionsResult> {
  validateDateRange(params.dateFrom, params.dateTo);

  const filters = buildFilters(params);
  const whereClause = filters.length ? and(...filters) : undefined;

  const totalQuery = db
    .select({
      value: sql<number>`count(*)`,
    })
    .from(questions);

  if (whereClause !== undefined) {
    totalQuery.where(whereClause);
  }

  const totalResult = await totalQuery;

  const total = Number(totalResult[0]?.value ?? 0);

  const offset = (params.page - 1) * params.pageSize;

  const rowsQuery = db
    .select({
      id: questions.id,
      prompt: questions.prompt,
      type: questions.type,
      difficulty: questions.difficulty,
      status: questions.status,
      categoryId: questions.categoryId,
      categoryName: contentCategories.name,
      categorySlug: contentCategories.slug,
      authorId: questions.authorId,
      authorName: user.name,
      createdAt: questions.createdAt,
      updatedAt: questions.updatedAt,
    })
    .from(questions)
    .leftJoin(user, eq(user.id, questions.authorId))
    .leftJoin(contentCategories, eq(contentCategories.id, questions.categoryId))
    .orderBy(...buildOrderBy(params.sort))
    .limit(params.pageSize)
    .offset(offset);

  if (whereClause !== undefined) {
    rowsQuery.where(whereClause);
  }

  const rows = await rowsQuery;

  const questionIds = rows.map((row) => row.id);

  const tagsByQuestion = new Map<
    number,
    { id: number; name: string; slug: string; color: string | null }[]
  >();

  if (questionIds.length) {
    const tagRows = await db
      .select({
        questionId: questionTags.questionId,
        tagId: tags.id,
        name: tags.name,
        slug: tags.slug,
        color: tags.color,
      })
      .from(questionTags)
      .innerJoin(tags, eq(tags.id, questionTags.tagId))
      .where(inArray(questionTags.questionId, questionIds));

    for (const tag of tagRows) {
      const list = tagsByQuestion.get(tag.questionId) ?? [];
      list.push({
        id: tag.tagId,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
      });
      tagsByQuestion.set(tag.questionId, list);
    }
  }

  const data: QuestionListItem[] = rows.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    type: row.type,
    difficulty: row.difficulty,
    status: row.status,
    category: row.categoryId
      ? {
          id: row.categoryId,
          name: row.categoryName ?? "",
          slug: row.categorySlug ?? "",
        }
      : null,
    author: row.authorId
      ? {
          id: row.authorId,
          name: row.authorName ?? "",
        }
      : null,
    tags: tagsByQuestion.get(row.id) ?? [],
    usageCount: 0,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  }));

  return {
    data,
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: params.pageSize ? Math.ceil(total / params.pageSize) : 0,
    },
  };
}

function buildFilters(params: ListQuestionsParams) {
  const filters: SQL<unknown>[] = [];

  if (params.q) {
    const term = `%${params.q.replace(/%/g, "")}%`;
    const condition = or(
      ilike(questions.prompt, term),
      ilike(questions.explanation, term),
    );

    if (condition) {
      filters.push(condition);
    }
  }

  if (params.categoryId) {
    filters.push(eq(questions.categoryId, params.categoryId));
  }

  if (params.types.length) {
    filters.push(inArray(questions.type, params.types));
  }

  if (params.difficulty) {
    filters.push(eq(questions.difficulty, params.difficulty));
  }

  if (params.status) {
    filters.push(eq(questions.status, params.status));
  }

  if (params.authorId) {
    filters.push(eq(questions.authorId, params.authorId));
  }

  if (params.dateFrom) {
    filters.push(gte(questions.updatedAt, params.dateFrom));
  }

  if (params.dateTo) {
    filters.push(lte(questions.updatedAt, params.dateTo));
  }

  if (params.tags.length) {
    const tagCondition = and(
      eq(questionTags.questionId, questions.id),
      inArray(tags.slug, params.tags),
    );

    const existsCondition = tagCondition
      ? exists(
          db
            .select({ questionId: questionTags.questionId })
            .from(questionTags)
            .innerJoin(tags, eq(tags.id, questionTags.tagId))
            .where(tagCondition),
        )
      : undefined;

    if (existsCondition) {
      filters.push(existsCondition);
    }
  }

  return filters;
}

function buildOrderBy(sort: SortOption) {
  switch (sort) {
    case "created_desc":
      return [desc(questions.createdAt)];
    case "name_asc":
      return [asc(questions.prompt)];
    case "category_asc":
      return [asc(contentCategories.name), asc(questions.prompt)];
    case "modified_desc":
    default:
      return [desc(questions.updatedAt)];
  }
}

function validateDateRange(start?: Date, end?: Date) {
  if (start && end && start > end) {
    const error = new Error("Invalid date range: start date must be before end date");
    (error as { status?: number; code?: string }).status = 400;
    (error as { status?: number; code?: string }).code = "invalid_date_range";
    throw error;
  }
}
