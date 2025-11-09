import { db } from "@/db";
import type { CreateQuestionBody, UpdateQuestionBody } from "./model";
import {
  questions,
  questionOptions,
  questionFillBlankAnswers,
  questionFillBlankOptions,
  questionMatchingPairs,
  questionTags,
  tags,
  type QuestionType,
  type QuestionDifficulty,
  type QuestionStatus,
} from "@/db/schema/questions";
import { asc, desc, eq, and, sql, ilike, or, inArray } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";
import { S3StorageService } from "./s3-storage.service";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const QUESTION_TYPE_REQUIREMENTS = {
  multiple_choice: "options",
  true_false: "options",
  fill_in_the_blank: "fillInBlanks",
  matching: "matchingPairs",
} as const;

function validateQuestionData(data: CreateQuestionBody | UpdateQuestionBody) {
  const type = data.type;
  if (!type) return;

  const requiredField = QUESTION_TYPE_REQUIREMENTS[type];
  const hasRequiredData = data[requiredField as keyof typeof data];

  if (
    !hasRequiredData ||
    (Array.isArray(hasRequiredData) && hasRequiredData.length === 0)
  ) {
    throw new Error(
      `Question type "${type}" requires "${requiredField}" to be provided`,
    );
  }
}

export abstract class QuestionsService {
  static async getQuestionById(questionId: number) {
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: true,
        options: {
          orderBy: (options) => [asc(options.id)],
        },
        fillInBlanks: {
          orderBy: (blanks) => [asc(blanks.sequence)],
          with: {
            options: true,
          },
        },
        matchingPairs: {
          orderBy: (pairs) => [asc(pairs.sequence)],
        },
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundError("Question");
    }

    return question;
  }

  static async createQuestion(
    newQuestion: CreateQuestionBody,
    authorId: string,
  ) {
    validateQuestionData(newQuestion);

    const { options, fillInBlanks, matchingPairs, tagIds, ...questionData } =
      newQuestion;

    return await db.transaction(async (tx) => {
      const [question] = await tx
        .insert(questions)
        .values({
          ...questionData,
          authorId,
        })
        .returning();

      if (options && options.length > 0) {
        await tx.insert(questionOptions).values(
          options.map((option) => ({
            questionId: question.id,
            ...option,
          })),
        );
      }

      if (fillInBlanks && fillInBlanks.length > 0) {
        for (const blank of fillInBlanks) {
          const { options: blankOptions, ...blankData } = blank;

          const [createdBlank] = await tx
            .insert(questionFillBlankAnswers)
            .values({
              questionId: question.id,
              ...blankData,
            })
            .returning();

          if (blankOptions && blankOptions.length > 0) {
            await tx.insert(questionFillBlankOptions).values(
              blankOptions.map((option) => ({
                blankId: createdBlank.id,
                ...option,
              })),
            );
          }
        }
      }

      if (matchingPairs && matchingPairs.length > 0) {
        await tx.insert(questionMatchingPairs).values(
          matchingPairs.map((pair) => ({
            questionId: question.id,
            ...pair,
          })),
        );
      }

      if (tagIds && tagIds.length > 0) {
        await tx.insert(questionTags).values(
          tagIds.map((tagId) => ({
            questionId: question.id,
            tagId,
            assignedBy: authorId,
          })),
        );
      }

      return question;
    });
  }

  static async updateQuestion(questionId: number, data: UpdateQuestionBody) {
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Question not found");
    }

    if (data.type) {
      validateQuestionData(data);
    }

    if (data.imageKey && existing.imageKey && data.imageKey !== existing.imageKey) {
      await S3StorageService.deleteImage(existing.imageKey);
    }

    const { options, fillInBlanks, matchingPairs, tagIds, ...questionData } =
      data;

    return await db.transaction(async (tx) => {
      const [question] = await tx
        .update(questions)
        .set({
          ...questionData,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, questionId))
        .returning();

      if (options !== undefined) {
        await tx
          .delete(questionOptions)
          .where(eq(questionOptions.questionId, questionId));

        if (options.length > 0) {
          await tx.insert(questionOptions).values(
            options.map((option) => ({
              questionId,
              ...option,
            })),
          );
        }
      }

      if (fillInBlanks !== undefined) {
        await tx
          .delete(questionFillBlankAnswers)
          .where(eq(questionFillBlankAnswers.questionId, questionId));

        if (fillInBlanks.length > 0) {
          for (const blank of fillInBlanks) {
            const { options: blankOptions, ...blankData } = blank;

            const [createdBlank] = await tx
              .insert(questionFillBlankAnswers)
              .values({
                questionId,
                ...blankData,
              })
              .returning();

            if (blankOptions && blankOptions.length > 0) {
              await tx.insert(questionFillBlankOptions).values(
                blankOptions.map((option) => ({
                  blankId: createdBlank.id,
                  ...option,
                })),
              );
            }
          }
        }
      }

      if (matchingPairs !== undefined) {
        await tx
          .delete(questionMatchingPairs)
          .where(eq(questionMatchingPairs.questionId, questionId));

        if (matchingPairs.length > 0) {
          await tx.insert(questionMatchingPairs).values(
            matchingPairs.map((pair) => ({
              questionId,
              ...pair,
            })),
          );
        }
      }

      if (tagIds !== undefined) {
        await tx
          .delete(questionTags)
          .where(eq(questionTags.questionId, questionId));

        if (tagIds.length > 0) {
          await tx.insert(questionTags).values(
            tagIds.map((tagId) => ({
              questionId,
              tagId,
            })),
          );
        }
      }

      return question;
    });
  }

  static async getAllQuestions({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    type,
    difficulty,
    status,
    categoryId,
    search,
    tags: tagFilter,
  }: {
    page?: number;
    pageSize?: number;
    type?: QuestionType | QuestionType[] | string | string[];
    difficulty?: QuestionDifficulty;
    status?: QuestionStatus;
    categoryId?: number;
    search?: string;
    tags?: string | string[];
  } = {}) {
    const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
    const conditions = [];

    // Handle type filtering (single or multiple)
    if (type) {
      if (Array.isArray(type)) {
        conditions.push(inArray(questions.type, type as QuestionType[]));
      } else {
        conditions.push(eq(questions.type, type as QuestionType));
      }
    }

    if (difficulty) conditions.push(eq(questions.difficulty, difficulty));
    if (status) conditions.push(eq(questions.status, status));
    if (categoryId) conditions.push(eq(questions.categoryId, categoryId));

    // Add search condition
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(questions.prompt, searchTerm),
          ilike(questions.explanation, searchTerm)
        )!
      );
    }

    // Handle tag filtering (supports both array and comma-separated string)
    if (tagFilter) {
      let tagNames: string[] = [];

      if (Array.isArray(tagFilter)) {
        tagNames = tagFilter.filter((tag) => tag && tag.trim().length > 0);
      } else if (typeof tagFilter === 'string' && tagFilter.trim()) {
        tagNames = tagFilter
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      }

      if (tagNames.length > 0) {
        const tagResults = await db
          .select({ questionId: questionTags.questionId })
          .from(questionTags)
          .leftJoin(tags, eq(questionTags.tagId, tags.id))
          .where(inArray(tags.name, tagNames));

        const tagQuestionIds = tagResults.map((r) => r.questionId);

        if (tagQuestionIds.length > 0) {
          conditions.push(inArray(questions.id, tagQuestionIds));
        } else {
          // No questions found with these tags, return empty result
          return {
            data: [],
            meta: {
              page,
              pageSize: safePageSize,
              total: 0,
              totalPages: 0,
            },
          };
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [allQuestions, totalCount] = await Promise.all([
      db.query.questions.findMany({
        where: whereClause,
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: true,
          options: {
            orderBy: (options) => [asc(options.id)],
          },
          tags: {
            with: {
              tag: true,
            },
          },
        },
        orderBy: [desc(questions.createdAt)],
        limit: safePageSize,
        offset: (page - 1) * safePageSize,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(questions)
        .where(whereClause)
        .then(([result]) => result?.count ?? 0),
    ]);

    return {
      data: allQuestions,
      meta: {
        page,
        pageSize: safePageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / safePageSize),
      },
    };
  }

  static async deleteQuestion(questionId: number) {
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Question");
    }

    // Delete associated image from S3 if exists
    if (existing.imageKey) {
      await S3StorageService.deleteImage(existing.imageKey);
    }

    await db.delete(questions).where(eq(questions.id, questionId));

    return existing;
  }

  static async archiveQuestion(questionId: number) {
    return this.updateQuestion(questionId, { status: "archived" });
  }
}
