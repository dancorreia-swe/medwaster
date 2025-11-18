import { db } from "@/db";
import {
  trails,
  trailContent,
  trailPrerequisites,
  userTrailProgress,
  userContentProgress,
  userQuestionAttempts,
} from "@/db/schema/trails";
import { questions, questionOptions } from "@/db/schema/questions";
import { quizzes, quizAttempts } from "@/db/schema/quizzes";
import { articles } from "@/db/schema/wiki";
import type { SubmitQuestionAnswerBody } from "./model";
import { eq, and, sql, inArray, isNull, desc, asc } from "drizzle-orm";
import {
  NotFoundError,
  BusinessLogicError,
  BadRequestError,
} from "@/lib/errors";
import { QuizzesService } from "../quizzes/quizzes.service";
import type { StartQuizAttemptBody, SubmitQuizAttemptBody } from "../quizzes/model";
import { DailyActivitiesService } from "../gamification/daily-activities.service";
import { CertificateService } from "../certificates/certificates.service";
import { trackTrailCompleted, trackArticleRead, trackQuestionAnswered } from "../achievements/trackers";

export abstract class ProgressService {
  // ===================================
  // Enrollment & Discovery
  // ===================================

  static async getAvailableTrails(userId: string) {
    // Get all published trails with user's progress
    const publishedTrails = await db.query.trails.findMany({
      where: eq(trails.status, "published"),
      with: {
        category: true,
        author: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
        prerequisites: {
          with: {
            prerequisiteTrail: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        asc(trails.unlockOrder),
        sql`CASE ${trails.difficulty}
          WHEN 'basic' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
          ELSE 4
        END`,
        asc(trails.name),
      ],
    });

    // Get user's progress for all trails
    const userProgress = await db.query.userTrailProgress.findMany({
      where: eq(userTrailProgress.userId, userId),
    });

    const progressMap = new Map(userProgress.map((p) => [p.trailId, p]));
    // Check eligibility for each trail
    const trailsWithEligibility = await Promise.all(
      publishedTrails.map(async (trail) => {
        const progress = progressMap.get(trail.id);
        const isEligible = await this.checkTrailEligibility(userId, trail.id);

        // Calculate progress percentage if enrolled
        let progressPercentage = 0;
        if (progress?.isEnrolled) {
          const completedIds = JSON.parse(progress.completedContentIds || "[]");
          // Get total content count for this trail
          const contentCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(trailContent)
            .where(eq(trailContent.trailId, trail.id));

          const totalContent = contentCount[0]?.count || 0;
          progressPercentage =
            totalContent > 0
              ? Math.round((completedIds.length / totalContent) * 100)
              : 0;
        }

        return {
          ...trail,
          isEnrolled: progress?.isEnrolled || false,
          isLocked: !isEligible,
          progress: progress
            ? {
                isEnrolled: progress.isEnrolled,
                isCompleted: progress.isCompleted,
                isPassed: progress.isPassed,
                currentScore: progress.bestScore,
                progressPercentage,
                currentContent: progress.currentContentId,
                completedContentIds: JSON.parse(
                  progress.completedContentIds || "[]",
                ),
                attempts: progress.attempts,
                bestScore: progress.bestScore,
                timeSpentMinutes: progress.timeSpentMinutes,
              }
            : null,
        };
      }),
    );

    return trailsWithEligibility;
  }

  static async enrollInTrail(userId: string, trailId: number) {
    // Check if trail exists and is published
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    if (trail.status !== "published") {
      throw new BusinessLogicError(
        "Cannot enroll in unpublished trail",
        "TRAIL_NOT_PUBLISHED",
      );
    }

    // Check if already enrolled
    const existingProgress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    if (existingProgress?.isEnrolled) {
      // Already enrolled - return existing progress instead of throwing error
      return this.getUserTrailProgress(userId, trailId);
    }

    // Check eligibility (prerequisites)
    const isEligible = await this.checkTrailEligibility(userId, trailId);
    if (!isEligible) {
      throw new BusinessLogicError(
        "Prerequisites not met for this trail",
        "PREREQUISITES_NOT_MET",
      );
    }

    // Create or update progress record
    if (existingProgress) {
      // User unlocked but never enrolled, now enrolling
      await db
        .update(userTrailProgress)
        .set({
          isEnrolled: true,
          enrolledAt: new Date(),
        })
        .where(eq(userTrailProgress.id, existingProgress.id));

      // Increment trail's enrolled count
      await db
        .update(trails)
        .set({
          enrolledCount: sql`${trails.enrolledCount} + 1`,
        })
        .where(eq(trails.id, trailId));
    } else {
      await db.insert(userTrailProgress).values({
        userId,
        trailId,
        isUnlocked: true,
        isEnrolled: true,
        enrolledAt: new Date(),
        lastAccessedAt: new Date(),
        completedContentIds: "[]",
        attempts: 0,
        timeSpentMinutes: 0,
        isCompleted: false,
        isPassed: false,
      });

      // Increment trail's enrolled count
      await db
        .update(trails)
        .set({
          enrolledCount: sql`${trails.enrolledCount} + 1`,
        })
        .where(eq(trails.id, trailId));
    }

    return this.getUserTrailProgress(userId, trailId);
  }

  static async getUserTrailProgress(userId: string, trailId: number) {
    const progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    if (!progress) {
      return null;
    }

    // Get trail details
    const trailRecord = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
    });

    if (!trailRecord) {
      throw new NotFoundError("Trail");
    }

    const contentItems = await db.query.trailContent.findMany({
      where: eq(trailContent.trailId, trailId),
      orderBy: [asc(trailContent.sequence)],
    });

    const completedIds = JSON.parse(progress.completedContentIds || "[]");
    const totalContent = contentItems.length;
    const completedContent = completedIds.length;
    const progressPercentage =
      totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;

    const trail = {
      ...trailRecord,
      content: contentItems,
    };

    return {
      ...progress,
      trail,
      completedContentIds: completedIds,
      progressPercentage,
      totalContent,
      completedContent,
    };
  }

  // ===================================
  // Content Access & Completion
  // ===================================

  static async getTrailContent(userId: string, trailId: number) {
    // Get trail metadata first to verify it exists
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
      columns: {
        id: true,
        allowSkipQuestions: true,
      },
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    // Check enrollment and auto-enroll if not enrolled
    let progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    // Auto-enroll if not enrolled - improves UX by removing friction
    if (!progress?.isEnrolled) {
      // Use the existing enrollInTrail method
      progress = await this.enrollInTrail(userId, trailId);
    }

    // Fetch ordered content items with their linked records
    const contentItems = await db.query.trailContent.findMany({
      where: eq(trailContent.trailId, trailId),
      orderBy: [asc(trailContent.sequence)],
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
        article: true,
      },
    });

    // Get user's content progress
    const contentProgress = await db.query.userContentProgress.findMany({
      where: eq(userContentProgress.userId, userId),
    });

    const progressMap = new Map(
      contentProgress.map((p) => [p.trailContentId, p]),
    );

    // Attach progress to each content item
    // Handle both string (from DB) and array (from enrollInTrail return)
    const completedIds = typeof progress.completedContentIds === 'string'
      ? JSON.parse(progress.completedContentIds || "[]")
      : (progress.completedContentIds || []);
    const contentWithProgress = contentItems.map((item, index) => {
      const itemProgress = progressMap.get(item.id);

      // Derive content type from foreign keys
      let contentType: "question" | "quiz" | "article";
      if (item.questionId) {
        contentType = "question";
      } else if (item.quizId) {
        contentType = "quiz";
      } else if (item.articleId) {
        contentType = "article";
      } else {
        throw new Error(`Invalid trail content item: ${item.id}`);
      }

      // Determine if item is accessible
      let isAccessible = true;
      if (!trail.allowSkipQuestions) {
        // Sequential mode: can only access if previous items are completed
        isAccessible =
          index === 0 || completedIds.includes(contentItems[index - 1].id);
      }

      return {
        ...item,
        contentType,
        isAccessible,
        isCompleted: completedIds.includes(item.id),
        progress: itemProgress
          ? {
              isCompleted: itemProgress.isCompleted,
              score: itemProgress.score,
              timeSpentMinutes: itemProgress.timeSpentMinutes,
              attempts: itemProgress.attempts,
            }
          : null,
      };
    });

    // Return just the content array (not nested object)
    return contentWithProgress;
  }

  static async markContentComplete(
    userId: string,
    trailId: number,
    contentId: number,
  ) {
    // Check enrollment and auto-enroll if not enrolled
    let progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    // Auto-enroll if not enrolled
    if (!progress?.isEnrolled) {
      progress = await this.enrollInTrail(userId, trailId);
    }

    // Verify content belongs to trail
    const content = await db.query.trailContent.findFirst({
      where: and(
        eq(trailContent.id, contentId),
        eq(trailContent.trailId, trailId),
      ),
    });

    if (!content) {
      throw new NotFoundError("Trail content");
    }

    // Check if already completed
    // Handle both string (from DB) and array (from enrollInTrail return)
    const completedIds: number[] = typeof progress.completedContentIds === 'string'
      ? JSON.parse(progress.completedContentIds || "[]")
      : (progress.completedContentIds || []);

    if (completedIds.includes(contentId)) {
      return progress; // Already completed
    }

    // Add to completed list
    completedIds.push(contentId);

    // Update or create content progress
    const existingContentProgress =
      await db.query.userContentProgress.findFirst({
        where: and(
          eq(userContentProgress.userId, userId),
          eq(userContentProgress.trailContentId, contentId),
        ),
      });

    if (existingContentProgress) {
      await db
        .update(userContentProgress)
        .set({
          isCompleted: true,
          completedAt: new Date(),
        })
        .where(eq(userContentProgress.id, existingContentProgress.id));
    } else {
      await db.insert(userContentProgress).values({
        userId,
        trailContentId: contentId,
        isCompleted: true,
        completedAt: new Date(),
        timeSpentMinutes: 0,
        attempts: 1,
      });
    }

    // Update trail progress
    await db
      .update(userTrailProgress)
      .set({
        completedContentIds: JSON.stringify(completedIds),
        lastAccessedAt: new Date(),
      })
      .where(eq(userTrailProgress.id, progress.id));

    // Check if trail is now complete
    await this.checkAndCompleteTrail(userId, trailId);

    return this.getUserTrailProgress(userId, trailId);
  }

  static async trackTimeSpent(
    userId: string,
    trailId: number,
    contentId: number,
    timeSpentMinutes: number,
  ) {
    let progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    // Auto-enroll if not enrolled
    if (!progress?.isEnrolled) {
      progress = await this.enrollInTrail(userId, trailId);
    }

    // Update content progress
    const existingContentProgress =
      await db.query.userContentProgress.findFirst({
        where: and(
          eq(userContentProgress.userId, userId),
          eq(userContentProgress.trailContentId, contentId),
        ),
      });

    if (existingContentProgress) {
      await db
        .update(userContentProgress)
        .set({
          timeSpentMinutes: sql`${userContentProgress.timeSpentMinutes} + ${timeSpentMinutes}`,
        })
        .where(eq(userContentProgress.id, existingContentProgress.id));
    } else {
      await db.insert(userContentProgress).values({
        userId,
        trailContentId: contentId,
        timeSpentMinutes,
        attempts: 0,
        isCompleted: false,
      });
    }

    // Update trail progress
    await db
      .update(userTrailProgress)
      .set({
        timeSpentMinutes: sql`${userTrailProgress.timeSpentMinutes} + ${timeSpentMinutes}`,
        lastAccessedAt: new Date(),
      })
      .where(eq(userTrailProgress.id, progress.id));
  }

  // ===================================
  // Question Submission (standalone in trail)
  // ===================================

  static async submitQuestionAnswer(
    userId: string,
    trailId: number,
    questionId: number,
    answer: SubmitQuestionAnswerBody,
  ) {
    // Check enrollment and auto-enroll if not enrolled
    let progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    // Auto-enroll if not enrolled
    if (!progress?.isEnrolled) {
      progress = await this.enrollInTrail(userId, trailId);
    }

    // Get question
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
      with: {
        options: true,
        fillInBlanks: {
          with: {
            options: true,
          },
        },
        matchingPairs: true,
      },
    });

    if (!question) {
      throw new NotFoundError("Question");
    }

    // Find the content item
    const content = await db.query.trailContent.findFirst({
      where: and(
        eq(trailContent.trailId, trailId),
        eq(trailContent.questionId, questionId),
      ),
    });

    if (!content) {
      throw new NotFoundError("Question in trail");
    }

    // Grade the answer
    const { isCorrect, correctAnswer } = await this.gradeQuestionAnswer(
      question,
      answer.answer,
    );

    // Record attempt
    await db.insert(userQuestionAttempts).values({
      userId,
      questionId,
      trailContentId: content.id,
      isCorrect,
      userAnswer: JSON.stringify(answer.answer),
      timeSpentSeconds: answer.timeSpentSeconds || 0,
    });

    // Track achievement for answering question
    await trackQuestionAnswered(userId, questionId, isCorrect);

    // Update content progress
    const contentProgress = await db.query.userContentProgress.findFirst({
      where: and(
        eq(userContentProgress.userId, userId),
        eq(userContentProgress.trailContentId, content.id),
      ),
    });

    if (contentProgress) {
      await db
        .update(userContentProgress)
        .set({
          attempts: sql`${userContentProgress.attempts} + 1`,
          score: isCorrect ? 100 : 0,
          timeSpentMinutes: sql`${userContentProgress.timeSpentMinutes} + ${Math.ceil((answer.timeSpentSeconds || 0) / 60)}`,
        })
        .where(eq(userContentProgress.id, contentProgress.id));
    } else {
      await db.insert(userContentProgress).values({
        userId,
        trailContentId: content.id,
        attempts: 1,
        score: isCorrect ? 100 : 0,
        timeSpentMinutes: Math.ceil((answer.timeSpentSeconds || 0) / 60),
        isCompleted: isCorrect,
        completedAt: isCorrect ? new Date() : null,
      });
    }

    // Check if trail was already completed before this action
    const wasAlreadyCompleted = progress.isCompleted;

    // Record activity for gamification
    // Record both trail_content (for trail progress) and question (for general stats)
    await DailyActivitiesService.recordActivity(userId, {
      type: "trail_content",
      metadata: {
        trailContentId: content.id,
        questionId: question.id,
        timeSpentMinutes: Math.ceil((answer.timeSpentSeconds || 0) / 60),
      },
    });

    // Also record as question activity for general question stats
    await DailyActivitiesService.recordActivity(userId, {
      type: "question",
      metadata: {
        questionId: question.id,
        timeSpentMinutes: Math.ceil((answer.timeSpentSeconds || 0) / 60),
      },
    });

    // If correct, mark as complete
    if (isCorrect) {
      await this.markContentComplete(userId, trailId, content.id);
    }

    // Check if trail was just completed
    const updatedProgress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    const trailJustCompleted = !wasAlreadyCompleted && updatedProgress?.isCompleted;

    return {
      isCorrect,
      correctAnswer,
      explanation: question.explanation,
      trailJustCompleted,
      progress: updatedProgress,
    };
  }

  /**
   * Start a quiz attempt within a trail
   */
  static async startQuizInTrail(
    userId: string,
    trailId: number,
    contentId: number,
    data: StartQuizAttemptBody,
  ) {
    // Check enrollment and auto-enroll if not enrolled
    let progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    // Auto-enroll if not enrolled
    if (!progress?.isEnrolled) {
      progress = await this.enrollInTrail(userId, trailId);
    }

    // Find the content item and verify it's a quiz
    const content = await db.query.trailContent.findFirst({
      where: and(
        eq(trailContent.id, contentId),
        eq(trailContent.trailId, trailId),
      ),
      with: {
        quiz: true,
      },
    });

    if (!content) {
      throw new NotFoundError("Trail content");
    }

    // Determine content type from which ID is set
    const contentType = content.quizId
      ? "quiz"
      : content.questionId
        ? "question"
        : content.articleId
          ? "article"
          : null;

    console.log("🔍 Quiz Start - Content found:", {
      id: content.id,
      contentType,
      quizId: content.quizId,
      questionId: content.questionId,
      articleId: content.articleId,
    });

    if (contentType !== "quiz" || !content.quizId) {
      console.log("❌ Content validation failed:", {
        contentType,
        expectedType: "quiz",
        quizId: content.quizId,
      });
      throw new BadRequestError("Content is not a quiz");
    }

    // Start the quiz attempt with trailContentId
    // Skip max attempts check since trails can be retried
    const result = await QuizzesService.startQuizAttempt(
      content.quizId,
      userId,
      data,
      true, // skipMaxAttemptsCheck - trails handle their own attempt logic
    );

    // Update the attempt record with trailContentId
    await db
      .update(quizAttempts)
      .set({ trailContentId: contentId })
      .where(eq(quizAttempts.id, result.attempt.id));

    return result;
  }

  /**
   * Submit a quiz attempt within a trail
   */
  static async submitQuizInTrail(
    userId: string,
    trailId: number,
    contentId: number,
    attemptId: number,
    data: SubmitQuizAttemptBody,
  ) {
    // Check enrollment and auto-enroll if not enrolled
    let progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    // Auto-enroll if not enrolled
    if (!progress?.isEnrolled) {
      progress = await this.enrollInTrail(userId, trailId);
    }

    // Find the content item and verify it's a quiz
    const content = await db.query.trailContent.findFirst({
      where: and(
        eq(trailContent.id, contentId),
        eq(trailContent.trailId, trailId),
      ),
    });

    if (!content) {
      throw new NotFoundError("Trail content");
    }

    // Determine content type from which ID is set
    const contentType = content.quizId
      ? "quiz"
      : content.questionId
        ? "question"
        : content.articleId
          ? "article"
          : null;

    if (contentType !== "quiz") {
      throw new BadRequestError("Content is not a quiz");
    }

    // Verify the attempt belongs to this content
    const attempt = await db.query.quizAttempts.findFirst({
      where: and(
        eq(quizAttempts.id, attemptId),
        eq(quizAttempts.userId, userId),
      ),
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt");
    }

    if (attempt.trailContentId !== contentId) {
      throw new BadRequestError("Attempt does not belong to this trail content");
    }

    // Submit the quiz
    const attemptResult = await QuizzesService.submitQuizAttempt(attemptId, userId, data);

    // Get full attempt results with answers
    const fullResults = await QuizzesService.getQuizAttemptResults(attemptId, userId);

    // Update or create content progress
    const existingProgress = await db.query.userContentProgress.findFirst({
      where: and(
        eq(userContentProgress.userId, userId),
        eq(userContentProgress.trailContentId, contentId),
      ),
    });

    const attempts = (existingProgress?.attempts || 0) + 1;
    const timeSpent = (existingProgress?.timeSpent || 0) + (data.timeSpent || 0);
    const score = attemptResult.score || 0;
    const isCompleted = score >= (content.passingScore || 70); // Use content passing score or default to 70%

    if (existingProgress) {
      await db
        .update(userContentProgress)
        .set({
          score,
          attempts,
          timeSpent,
          isCompleted,
          completedAt: isCompleted ? new Date() : existingProgress.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(userContentProgress.id, existingProgress.id));
    } else {
      await db.insert(userContentProgress).values({
        userId,
        trailContentId: contentId,
        score,
        attempts,
        timeSpent,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      });
    }

    // Check if trail was already completed before this action
    const wasAlreadyCompleted = progress.isCompleted;

    // Record activity for gamification
    // Record both trail_content (for trail progress) and quiz (for general stats)
    await DailyActivitiesService.recordActivity(userId, {
      type: "trail_content",
      metadata: {
        trailContentId: contentId,
        quizId: content.quizId!,
        score: attemptResult.score || 0,
        timeSpentMinutes: Math.ceil((data.timeSpent || 0) / 60),
      },
    });

    // Also record as quiz activity for general quiz stats
    await DailyActivitiesService.recordActivity(userId, {
      type: "quiz",
      metadata: {
        quizId: content.quizId!,
        score: attemptResult.score || 0,
        timeSpentMinutes: Math.ceil((data.timeSpent || 0) / 60),
      },
    });

    // Also record individual questions answered in the quiz
    const questionCount = fullResults.answers?.length || 0;
    for (let i = 0; i < questionCount; i++) {
      await DailyActivitiesService.recordActivity(userId, {
        type: "question",
        metadata: {
          questionId: fullResults.answers?.[i]?.question?.id,
        },
      });
    }

    // Mark content as complete if passed
    if (isCompleted) {
      await this.markContentComplete(userId, trailId, contentId);
    }

    // Check if trail was just completed
    const updatedProgress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    const trailJustCompleted = !wasAlreadyCompleted && updatedProgress?.isCompleted;

    // Calculate correct/incorrect counts from answers
    const correctAnswers = fullResults.answers?.filter((a: any) => a.isCorrect).length || 0;
    const totalAnswers = fullResults.answers?.length || 0;
    const incorrectAnswers = totalAnswers - correctAnswers;

    return {
      ...attemptResult,
      quiz: fullResults.quiz,
      answers: fullResults.answers,
      correctAnswers,
      incorrectAnswers,
      trailJustCompleted,
      progress: updatedProgress,
    };
  }

  /**
   * Mark an article in trail as read
   */
  static async markArticleReadInTrail(
    userId: string,
    trailId: number,
    contentId: number,
  ) {
    // Check enrollment and auto-enroll if not enrolled
    let progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    // Auto-enroll if not enrolled
    if (!progress?.isEnrolled) {
      progress = await this.enrollInTrail(userId, trailId);
    }

    // Find the content item and verify it's an article
    const content = await db.query.trailContent.findFirst({
      where: and(
        eq(trailContent.id, contentId),
        eq(trailContent.trailId, trailId),
      ),
    });

    if (!content) {
      throw new NotFoundError("Trail content");
    }

    // Verify it's an article by checking if articleId is set and others are not
    if (!content.articleId || content.questionId || content.quizId) {
      throw new BadRequestError("Content is not an article");
    }

    // Check if trail was already completed before this action
    const wasAlreadyCompleted = progress.isCompleted;

    // Update or create content progress
    const existingProgress = await db.query.userContentProgress.findFirst({
      where: and(
        eq(userContentProgress.userId, userId),
        eq(userContentProgress.trailContentId, contentId),
      ),
    });

    if (existingProgress) {
      await db
        .update(userContentProgress)
        .set({
          score: 100, // Articles are binary - read or not read
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userContentProgress.id, existingProgress.id));
    } else {
      await db.insert(userContentProgress).values({
        userId,
        trailContentId: contentId,
        score: 100,
        attempts: 1,
        timeSpent: 0, // Time tracking is separate
        isCompleted: true,
        completedAt: new Date(),
      });
    }

    // Record activity for gamification
    // Record both trail_content (for trail progress) and article (for general stats)
    await DailyActivitiesService.recordActivity(userId, {
      type: "trail_content",
      metadata: {
        trailContentId: contentId,
        articleId: content.articleId,
      },
    });

    // Also record as article activity for general article stats
    await DailyActivitiesService.recordActivity(userId, {
      type: "article",
      metadata: {
        articleId: content.articleId,
      },
    });

    // Track achievement for article read
    try {
      await trackArticleRead(userId, content.articleId?.toString() || "", undefined);
    } catch (error) {
      console.error("Failed to track article read achievement:", error);
    }

    // Mark content as complete in trail
    await this.markContentComplete(userId, trailId, contentId);

    // Check if trail was just completed
    const updatedProgress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    const trailJustCompleted = !wasAlreadyCompleted && updatedProgress?.isCompleted;

    return {
      success: true,
      trailJustCompleted,
      progress: updatedProgress,
    };
  }

  // ===================================
  // Helper Methods
  // ===================================

  private static async checkTrailEligibility(
    userId: string,
    trailId: number,
  ): Promise<boolean> {
    // Get trail prerequisites
    const prerequisites = await db.query.trailPrerequisites.findMany({
      where: eq(trailPrerequisites.trailId, trailId),
    });

    if (prerequisites.length === 0) {
      return true; // No prerequisites
    }

    // Check if user has completed all prerequisites
    const prerequisiteIds = prerequisites.map((p) => p.prerequisiteTrailId);
    const userProgress = await db.query.userTrailProgress.findMany({
      where: and(
        eq(userTrailProgress.userId, userId),
        inArray(userTrailProgress.trailId, prerequisiteIds),
      ),
    });

    // All prerequisites must be passed
    const passedPrerequisites = userProgress.filter((p) => p.isPassed);
    return passedPrerequisites.length === prerequisites.length;
  }

  private static async checkAndCompleteTrail(userId: string, trailId: number) {
    const [progress, trailRecord, contentItems] = await Promise.all([
      db.query.userTrailProgress.findFirst({
        where: and(
          eq(userTrailProgress.userId, userId),
          eq(userTrailProgress.trailId, trailId),
        ),
      }),
      db.query.trails.findFirst({
        where: eq(trails.id, trailId),
      }),
      db.query.trailContent.findMany({
        where: eq(trailContent.trailId, trailId),
      }),
    ]);

    if (!progress || !trailRecord) return;

    // Skip if already completed
    if (progress.isCompleted) return;

    // Check if all required content is completed
    const completedIds: number[] = JSON.parse(
      progress.completedContentIds || "[]",
    );
    const requiredContent = contentItems.filter((c) => c.isRequired);
    const allRequiredCompleted = requiredContent.every((c) =>
      completedIds.includes(c.id),
    );

    if (!allRequiredCompleted) return;

    // Calculate trail score based on completed content
    let totalScore = 0;
    let totalPossiblePoints = 0;

    // Get content progress for all required content
    const contentProgressRecords = await db.query.userContentProgress.findMany({
      where: and(
        eq(userContentProgress.userId, userId),
        inArray(
          userContentProgress.trailContentId,
          requiredContent.map((c) => c.id),
        ),
      ),
    });

    // Create a map for quick lookup
    const progressMap = new Map(
      contentProgressRecords.map((p) => [p.trailContentId, p]),
    );

    // Calculate weighted score
    for (const content of requiredContent) {
      const contentProgress = progressMap.get(content.id);
      const points = content.points || 1; // Default to 1 point if not specified
      const contentScore = contentProgress?.score || 0;

      totalScore += (contentScore * points) / 100; // Convert percentage to actual points
      totalPossiblePoints += points;
    }

    // Calculate final percentage score
    const score =
      totalPossiblePoints > 0
        ? Math.round((totalScore / totalPossiblePoints) * 100)
        : 0;

    const isPassed = score >= trailRecord.passPercentage;

    // Mark trail as complete
    await db
      .update(userTrailProgress)
      .set({
        isCompleted: true,
        isPassed,
        currentScore: score,
        bestScore: Math.max(progress.bestScore || 0, score),
        completedAt: new Date(),
      })
      .where(eq(userTrailProgress.id, progress.id));

    // Record trail completion activity for gamification stats
    console.log("🎉 [Trail Completion] Recording trail completion activity:", {
      userId,
      trailId,
      score,
      isPassed,
    });

    const activityResult = await DailyActivitiesService.recordActivity(userId, {
      type: "trail_completed",
      metadata: {
        trailId,
        score,
      },
    });

    console.log("📊 [Trail Completion] Activity recorded:", {
      trailsCompleted: activityResult.trailsCompleted,
      hasCompletedActivity: activityResult.hasCompletedActivity,
    });

    // Track achievement progress
    console.log("🏆 [Trail Completion] Tracking achievement progress...");
    try {
      const isPerfect = score === 100;
      await trackTrailCompleted(userId, trailId.toString(), score, isPerfect);
      console.log("  ✓ Achievement tracking completed");
    } catch (error) {
      console.error("  ✗ Failed to track achievement:", error);
      // Don't fail trail completion if achievement tracking fails
    }

    if (isPassed) {
      // Unlock dependent trails
      await this.unlockDependentTrails(userId, trailId);

      // Check if user completed ALL trails and generate certificate
      try {
        const hasCompletedAll = await CertificateService.hasCompletedAllTrails(userId);
        if (hasCompletedAll) {
          await CertificateService.generateCertificate(userId);
        }
      } catch (error) {
        console.error("Failed to generate certificate:", error);
        // Don't fail the trail completion if certificate generation fails
      }

      // TODO: Trigger achievement integration
    }
  }

  private static async unlockDependentTrails(userId: string, trailId: number) {
    // Find trails that have this trail as a prerequisite
    const dependents = await db.query.trailPrerequisites.findMany({
      where: eq(trailPrerequisites.prerequisiteTrailId, trailId),
    });

    for (const dependent of dependents) {
      // Check if user can now unlock this trail
      const isEligible = await this.checkTrailEligibility(
        userId,
        dependent.trailId,
      );

      if (isEligible) {
        // Check if progress record exists
        const existing = await db.query.userTrailProgress.findFirst({
          where: and(
            eq(userTrailProgress.userId, userId),
            eq(userTrailProgress.trailId, dependent.trailId),
          ),
        });

        if (!existing) {
          // Create unlocked record
          await db.insert(userTrailProgress).values({
            userId,
            trailId: dependent.trailId,
            isUnlocked: true,
            isEnrolled: false,
            completedContentIds: "[]",
            attempts: 0,
            timeSpentMinutes: 0,
            isCompleted: false,
            isPassed: false,
          });
        } else if (!existing.isUnlocked) {
          // Unlock existing record
          await db
            .update(userTrailProgress)
            .set({ isUnlocked: true })
            .where(eq(userTrailProgress.id, existing.id));
        }
      }
    }
  }

  private static async gradeQuestionAnswer(question: any, userAnswer: any) {
    let isCorrect = false;
    let correctAnswer: any = null;

    switch (question.type) {
      case "multiple_choice":
      case "true_false":
        const correctOptions = question.options.filter((o: any) => o.isCorrect);
        correctAnswer = correctOptions.map((o: any) => o.id);

        if (typeof userAnswer === "number") {
          isCorrect = correctOptions.some((o: any) => o.id === userAnswer);
        } else if (Array.isArray(userAnswer)) {
          isCorrect =
            correctOptions.length === userAnswer.length &&
            correctOptions.every((o: any) => userAnswer.includes(o.id));
        }
        break;

      case "fill_in_the_blank":
        // For fill-in-blank with options, userAnswer is an object: { blankId: selectedText }
        // Check if all blanks have the correct option selected
        if (typeof userAnswer === 'object' && !Array.isArray(userAnswer)) {
          correctAnswer = question.fillInBlanks.reduce((acc: any, blank: any) => {
            const correctOption = blank.options?.find((opt: any) => opt.isCorrect);
            acc[blank.id.toString()] = correctOption?.text || blank.answer;
            return acc;
          }, {});

          console.log('[Fill-Blank Grading] Debug:', {
            userAnswer,
            correctAnswer,
            fillInBlanks: question.fillInBlanks.map((blank: any) => ({
              id: blank.id,
              options: blank.options?.map((o: any) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }))
            }))
          });

          // Check if all blanks are answered correctly
          isCorrect = question.fillInBlanks.every((blank: any) => {
            const correctOption = blank.options?.find((opt: any) => opt.isCorrect);
            const expectedAnswer = correctOption?.text || blank.answer;
            const userBlankAnswer = userAnswer[blank.id.toString()];
            
            console.log(`[Fill-Blank] Checking blank ${blank.id}:`, {
              userBlankAnswer,
              expectedAnswer,
              match: userBlankAnswer?.toLowerCase().trim() === expectedAnswer?.toLowerCase().trim()
            });
            
            return userBlankAnswer?.toLowerCase().trim() === expectedAnswer?.toLowerCase().trim();
          });
        } else {
          // Legacy: single blank text answer
          correctAnswer = question.fillInBlanks.map((blank: any) => blank.answer);
          isCorrect = question.fillInBlanks.some((blank: any) =>
            blank.answer.toLowerCase().trim() ===
            (userAnswer || "").toLowerCase().trim()
          );
        }
        break;

      case "matching":
        // Verify all matching pairs are correct
        correctAnswer = question.matchingPairs.reduce((acc: any, pair: any) => {
          acc[pair.leftText] = pair.rightText;
          return acc;
        }, {});

        if (userAnswer && typeof userAnswer === "object") {
          isCorrect = question.matchingPairs.every((pair: any) =>
            userAnswer[pair.leftText] === pair.rightText
          );
        }
        break;

      default:
        throw new BadRequestError("Question type not supported for grading");
    }

    return { isCorrect, correctAnswer };
  }
}
