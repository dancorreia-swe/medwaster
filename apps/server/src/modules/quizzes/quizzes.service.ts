import { db } from "@/db";
import type { 
  CreateQuizBody, 
  UpdateQuizBody, 
  StartQuizAttemptBody,
  SubmitQuizAttemptBody 
} from "./model";
import {
  quizzes,
  quizQuestions,
  quizAttempts,
  quizAnswers,
  type QuizStatus,
  type QuizDifficulty,
} from "@/db/schema/quizzes";
import { questions, questionOptions } from "@/db/schema/questions";
import { asc, desc, eq, and, sql, ilike, or, count } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export abstract class QuizzesService {
  static async getQuizById(quizId: number, includeQuestions = true) {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: true,
        questions: includeQuestions ? {
          orderBy: (quizQuestions) => [asc(quizQuestions.order)],
          with: {
            question: {
              with: {
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
            },
          },
        } : false,
      },
    });

    if (!quiz) {
      throw new NotFoundError("Quiz");
    }

    return quiz;
  }

  static async createQuiz(newQuiz: CreateQuizBody, authorId: string) {
    const { questions: quizQuestionsList, ...quizData } = newQuiz;

    return await db.transaction(async (tx) => {
      const [quiz] = await tx
        .insert(quizzes)
        .values({
          ...quizData,
          authorId,
        })
        .returning();

      if (quizQuestionsList && quizQuestionsList.length > 0) {
        await tx.insert(quizQuestions).values(
          quizQuestionsList.map((q) => ({
            quizId: quiz.id,
            ...q,
          })),
        );
      }

      return quiz;
    });
  }

  static async updateQuiz(quizId: number, data: UpdateQuizBody) {
    const [existing] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Quiz");
    }

    const { questions: quizQuestionsList, ...quizData } = data;

    return await db.transaction(async (tx) => {
      const [quiz] = await tx
        .update(quizzes)
        .set({
          ...quizData,
          updatedAt: new Date(),
        })
        .where(eq(quizzes.id, quizId))
        .returning();

      if (quizQuestionsList !== undefined) {
        await tx
          .delete(quizQuestions)
          .where(eq(quizQuestions.quizId, quizId));

        if (quizQuestionsList.length > 0) {
          await tx.insert(quizQuestions).values(
            quizQuestionsList.map((q) => ({
              quizId,
              ...q,
            })),
          );
        }
      }

      return quiz;
    });
  }

  static async getAllQuizzes({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    status,
    difficulty,
    categoryId,
    search,
  }: {
    page?: number;
    pageSize?: number;
    status?: QuizStatus;
    difficulty?: QuizDifficulty;
    categoryId?: number;
    search?: string;
  } = {}) {
    const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
    const conditions = [];

    if (status) conditions.push(eq(quizzes.status, status));
    if (difficulty) conditions.push(eq(quizzes.difficulty, difficulty));
    if (categoryId) conditions.push(eq(quizzes.categoryId, categoryId));
    
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(quizzes.title, searchTerm),
          ilike(quizzes.description, searchTerm)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [allQuizzes, totalCount] = await Promise.all([
      db.query.quizzes.findMany({
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
          questions: {
            columns: {
              id: true,
            },
          },
        },
        orderBy: [desc(quizzes.createdAt)],
        limit: safePageSize,
        offset: (page - 1) * safePageSize,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(quizzes)
        .where(whereClause)
        .then(([result]) => result?.count ?? 0),
    ]);

    // Add question count to each quiz
    const quizzesWithMeta = allQuizzes.map((quiz) => ({
      ...quiz,
      questionCount: quiz.questions.length,
      questions: undefined, // Remove the questions array to keep response clean
    }));

    return {
      data: quizzesWithMeta,
      meta: {
        page,
        pageSize: safePageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / safePageSize),
      },
    };
  }

  static async deleteQuiz(quizId: number) {
    const [existing] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Quiz");
    }

    await db.delete(quizzes).where(eq(quizzes.id, quizId));

    return existing;
  }

  static async archiveQuiz(quizId: number) {
    return this.updateQuiz(quizId, { status: "archived" });
  }

  // Student-facing methods
  static async getAvailableQuizzes({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    difficulty,
    categoryId,
    search,
  }: {
    page?: number;
    pageSize?: number;
    difficulty?: QuizDifficulty;
    categoryId?: number;
    search?: string;
  } = {}) {
    const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
    const conditions = [eq(quizzes.status, "active")];

    if (difficulty) conditions.push(eq(quizzes.difficulty, difficulty));
    if (categoryId) conditions.push(eq(quizzes.categoryId, categoryId));
    
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(quizzes.title, searchTerm),
          ilike(quizzes.description, searchTerm)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [allQuizzes, totalCount] = await Promise.all([
      db.query.quizzes.findMany({
        where: whereClause,
        columns: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          timeLimit: true,
          maxAttempts: true,
          passingScore: true,
          imageUrl: true,
          createdAt: true,
        },
        with: {
          category: true,
          questions: {
            columns: {
              id: true,
              points: true,
            },
          },
        },
        orderBy: [desc(quizzes.createdAt)],
        limit: safePageSize,
        offset: (page - 1) * safePageSize,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(quizzes)
        .where(whereClause)
        .then(([result]) => result?.count ?? 0),
    ]);

    const quizzesWithMeta = allQuizzes.map((quiz) => ({
      ...quiz,
      questionCount: quiz.questions.length,
      totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
      questions: undefined,
    }));

    return {
      data: quizzesWithMeta,
      meta: {
        page,
        pageSize: safePageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / safePageSize),
      },
    };
  }

  static async startQuizAttempt(
    quizId: number, 
    userId: string, 
    data: StartQuizAttemptBody
  ) {
    const quiz = await this.getQuizById(quizId, false);
    
    if (quiz.status !== "active") {
      throw new Error("Quiz is not available");
    }

    // Check attempt limits
    const existingAttempts = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.userId, userId)
        )
      )
      .then(([result]) => result?.count ?? 0);

    if (quiz.maxAttempts && existingAttempts >= quiz.maxAttempts) {
      throw new Error("Maximum attempts exceeded");
    }

    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        quizId,
        userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      })
      .returning();

    return attempt;
  }

  static async submitQuizAttempt(
    attemptId: number,
    userId: string,
    data: SubmitQuizAttemptBody
  ) {
    const attempt = await db.query.quizAttempts.findFirst({
      where: and(
        eq(quizAttempts.id, attemptId),
        eq(quizAttempts.userId, userId)
      ),
      with: {
        quiz: {
          with: {
            questions: {
              with: {
                question: {
                  with: {
                    options: true,
                    fillInBlanks: {
                      with: {
                        options: true,
                      },
                    },
                    matchingPairs: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt");
    }

    if (attempt.status !== "in_progress") {
      throw new Error("Attempt is not in progress");
    }

    return await db.transaction(async (tx) => {
      let totalPoints = 0;
      let earnedPoints = 0;

      // Process each answer
      for (const answerData of data.answers) {
        const quizQuestion = attempt.quiz.questions.find(
          (q) => q.id === answerData.quizQuestionId
        );

        if (!quizQuestion) continue;

        totalPoints += quizQuestion.points;
        const isCorrect = this.checkAnswer(quizQuestion.question, answerData);
        const pointsEarned = isCorrect ? quizQuestion.points : 0;
        earnedPoints += pointsEarned;

        await tx.insert(quizAnswers).values({
          attemptId,
          questionId: quizQuestion.questionId,
          quizQuestionId: answerData.quizQuestionId,
          selectedOptions: answerData.selectedOptions ? 
            JSON.stringify(answerData.selectedOptions) : null,
          textAnswer: answerData.textAnswer,
          matchingAnswers: answerData.matchingAnswers ? 
            JSON.stringify(answerData.matchingAnswers) : null,
          isCorrect,
          pointsEarned,
          timeSpent: answerData.timeSpent,
        });
      }

      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

      const [updatedAttempt] = await tx
        .update(quizAttempts)
        .set({
          status: "completed",
          score,
          totalPoints,
          earnedPoints,
          completedAt: new Date(),
          submittedAt: new Date(),
          timeSpent: data.timeSpent,
        })
        .where(eq(quizAttempts.id, attemptId))
        .returning();

      return updatedAttempt;
    });
  }

  private static checkAnswer(question: any, answerData: any): boolean {
    switch (question.type) {
      case "multiple_choice":
      case "true_false":
        if (!answerData.selectedOptions) return false;
        const correctOptionIds = question.options
          .filter((opt: any) => opt.isCorrect)
          .map((opt: any) => opt.id);
        return (
          answerData.selectedOptions.length === correctOptionIds.length &&
          answerData.selectedOptions.every((id: number) => 
            correctOptionIds.includes(id))
        );

      case "fill_in_the_blank":
        // Simple text comparison (could be enhanced with fuzzy matching)
        return question.fillInBlanks.some((blank: any) =>
          blank.answer.toLowerCase().trim() === 
          (answerData.textAnswer || "").toLowerCase().trim()
        );

      case "matching":
        if (!answerData.matchingAnswers) return false;
        return question.matchingPairs.every((pair: any) =>
          answerData.matchingAnswers[pair.leftText] === pair.rightText
        );

      default:
        return false;
    }
  }

  static async getQuizAttemptResults(attemptId: number, userId: string) {
    const attempt = await db.query.quizAttempts.findFirst({
      where: and(
        eq(quizAttempts.id, attemptId),
        eq(quizAttempts.userId, userId)
      ),
      with: {
        quiz: true,
        answers: {
          with: {
            question: {
              with: {
                options: true,
              },
            },
            quizQuestion: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt");
    }

    return attempt;
  }
}