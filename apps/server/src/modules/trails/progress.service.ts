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
import type { SubmitQuestionAnswerBody } from "./model";
import { eq, and, sql, inArray, isNull, desc } from "drizzle-orm";
import {
  NotFoundError,
  BusinessLogicError,
  BadRequestError,
} from "@/lib/errors";

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

        return {
          ...trail,
          isEnrolled: progress?.isEnrolled || false,
          isLocked: !isEligible,
          progress: progress
            ? {
                currentContent: progress.currentContentId,
                completedContentIds: JSON.parse(
                  progress.completedContentIds || "[]",
                ),
                attempts: progress.attempts,
                bestScore: progress.bestScore,
                isCompleted: progress.isCompleted,
                isPassed: progress.isPassed,
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
      throw new BusinessLogicError(
        "Already enrolled in this trail",
        "ALREADY_ENROLLED",
      );
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
    }

    // Increment trail's enrolled count
    await db
      .update(trails)
      .set({
        enrolledCount: sql`${trails.enrolledCount} + 1`,
      })
      .where(eq(trails.id, trailId));

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
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
      with: {
        content: {
          orderBy: [(content) => content.sequence],
        },
      },
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    const completedIds = JSON.parse(progress.completedContentIds || "[]");
    const totalContent = trail.content.length;
    const completedContent = completedIds.length;
    const progressPercentage =
      totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;

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
    // Verify enrollment
    const progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    if (!progress?.isEnrolled) {
      throw new BusinessLogicError("Not enrolled in this trail", "NOT_ENROLLED");
    }

    // Get trail with content
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
      with: {
        content: {
          orderBy: [(content) => content.sequence],
          with: {
            question: true,
            quiz: true,
            article: true,
          },
        },
      },
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    // Get user's content progress
    const contentProgress = await db.query.userContentProgress.findMany({
      where: eq(userContentProgress.userId, userId),
    });

    const progressMap = new Map(
      contentProgress.map((p) => [p.trailContentId, p]),
    );

    // Attach progress to each content item
    const completedIds = JSON.parse(progress.completedContentIds || "[]");
    const contentWithProgress = trail.content.map((item, index) => {
      const itemProgress = progressMap.get(item.id);

      // Determine if item is accessible
      let isAccessible = true;
      if (!trail.allowSkipQuestions) {
        // Sequential mode: can only access if previous items are completed
        isAccessible = index === 0 || completedIds.includes(trail.content[index - 1].id);
      }

      return {
        ...item,
        isAccessible,
        isCompleted: completedIds.includes(item.id),
        userProgress: itemProgress
          ? {
              isCompleted: itemProgress.isCompleted,
              score: itemProgress.score,
              timeSpentMinutes: itemProgress.timeSpentMinutes,
              attempts: itemProgress.attempts,
            }
          : null,
      };
    });

    return {
      trail,
      content: contentWithProgress,
      userProgress: progress,
    };
  }

  static async markContentComplete(
    userId: string,
    trailId: number,
    contentId: number,
  ) {
    // Verify enrollment
    const progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    if (!progress?.isEnrolled) {
      throw new BusinessLogicError("Not enrolled in this trail", "NOT_ENROLLED");
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
    const completedIds: number[] = JSON.parse(
      progress.completedContentIds || "[]",
    );

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
    const progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    if (!progress?.isEnrolled) {
      throw new BusinessLogicError("Not enrolled in this trail", "NOT_ENROLLED");
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
    // Verify enrollment
    const progress = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.trailId, trailId),
      ),
    });

    if (!progress?.isEnrolled) {
      throw new BusinessLogicError("Not enrolled in this trail", "NOT_ENROLLED");
    }

    // Get question
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
      with: {
        options: true,
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

    // If correct, mark as complete
    if (isCorrect) {
      await this.markContentComplete(userId, trailId, content.id);
    }

    return {
      isCorrect,
      correctAnswer,
      explanation: question.explanation,
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
    const [progress, trail] = await Promise.all([
      db.query.userTrailProgress.findFirst({
        where: and(
          eq(userTrailProgress.userId, userId),
          eq(userTrailProgress.trailId, trailId),
        ),
      }),
      db.query.trails.findFirst({
        where: eq(trails.id, trailId),
        with: {
          content: true,
        },
      }),
    ]);

    if (!progress || !trail) return;

    // Check if all required content is completed
    const completedIds: number[] = JSON.parse(
      progress.completedContentIds || "[]",
    );
    const requiredContent = trail.content.filter((c) => c.isRequired);
    const allRequiredCompleted = requiredContent.every((c) =>
      completedIds.includes(c.id),
    );

    if (!allRequiredCompleted) return;

    // Calculate score (placeholder - would need actual scoring logic)
    const score = 100; // TODO: Calculate based on quiz/question scores

    const isPassed = score >= trail.passPercentage;

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

    if (isPassed) {
      // Unlock dependent trails
      await this.unlockDependentTrails(userId, trailId);

      // TODO: Trigger achievement integration
      // TODO: Generate certificate if customCertificate is true
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

      // TODO: Implement grading for fill_in_the_blank and matching
      default:
        throw new BadRequestError("Question type not supported for grading");
    }

    return { isCorrect, correctAnswer };
  }
}
