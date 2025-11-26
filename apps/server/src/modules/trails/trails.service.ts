import { db } from "@/db";
import {
  trails,
  trailContent,
  trailPrerequisites,
  userTrailProgress,
  userContentProgress,
  userQuestionAttempts,
} from "@/db/schema/trails";
import { questions } from "@/db/schema/questions";
import { quizzes } from "@/db/schema/quizzes";
import { wikiArticles, userArticleReads } from "@/db/schema/wiki";
import { contentCategories } from "@/db/schema/categories";
import type {
  CreateTrailBody,
  UpdateTrailBody,
  AddContentBody,
  UpdateContentBody,
  ReorderContentBody,
  ListTrailsQuery,
  SubmitQuestionAnswerBody,
} from "./model";
import {
  eq,
  and,
  sql,
  desc,
  asc,
  ilike,
  or,
  inArray,
  isNull,
} from "drizzle-orm";
import {
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  BadRequestError,
} from "@/lib/errors";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export abstract class TrailsService {
  private static async getBlockingDependentTrails(trailId: number) {
    const dependents = await db.query.trailPrerequisites.findMany({
      where: eq(trailPrerequisites.prerequisiteTrailId, trailId),
      with: {
        trail: {
          columns: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return dependents
      .map((dependent) => dependent.trail)
      .filter((trail): trail is { id: number; name: string; status: string } =>
        Boolean(trail && trail.status !== "archived"),
      );
  }

  // ===================================
  // Trail CRUD Operations
  // ===================================

  /**
   * Retrieves a paginated list of trails with optional filtering
   *
   * @param query - Query parameters for filtering and pagination
   * @param query.page - Page number (default: 1)
   * @param query.pageSize - Number of items per page (default: 20, max: 100)
   * @param query.status - Filter by trail status (draft, published, inactive, archived)
   * @param query.difficulty - Filter by difficulty level (basic, intermediate, advanced)
   * @param query.categoryId - Filter by category ID
   * @param query.search - Search term to match against trail name and description
   *
   * @returns Object containing:
   *   - data: Array of trails with author and category relations
   *   - meta: Pagination metadata (page, pageSize, total, totalPages)
   *
   * @example
   * ```ts
   * const result = await TrailsService.getAllTrails({
   *   page: 1,
   *   pageSize: 20,
   *   status: 'published',
   *   difficulty: 'intermediate',
   *   search: 'JavaScript'
   * });
   * ```
   */
  static async getAllTrails(query: ListTrailsQuery = {}) {
    const {
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      status,
      difficulty,
      categoryId,
      search,
    } = query;

    const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
    const conditions = [];

    if (status) conditions.push(eq(trails.status, status));
    if (difficulty) conditions.push(eq(trails.difficulty, difficulty));
    if (categoryId) conditions.push(eq(trails.categoryId, categoryId));

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(trails.name, searchTerm),
          ilike(trails.description, searchTerm),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [allTrails, totalCount] = await Promise.all([
      db.query.trails.findMany({
        where: whereClause,
        orderBy: [asc(trails.unlockOrder), desc(trails.createdAt)],
        limit: safePageSize,
        offset: (page - 1) * safePageSize,
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: true,
          content: {
            columns: {
              id: true,
              sequence: true,
            },
          },
          prerequisites: {
            columns: {
              prerequisiteTrailId: true,
            },
          },
        },
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(trails)
        .where(whereClause)
        .then(([result]) => result?.count ?? 0),
    ]);

    return {
      data: allTrails,
      meta: {
        page,
        pageSize: safePageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / safePageSize),
      },
    };
  }

  static async getTrailById(trailId: number, includeContent = true) {
    // Build the with clause conditionally
    const withClause: any = {
      author: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: true,
    };

    // Only include content if requested
    if (includeContent) {
      withClause.content = {
        orderBy: [asc(trailContent.sequence)],
        with: {
          question: {
            columns: {
              id: true,
              prompt: true,
              type: true,
              difficulty: true,
            },
          },
          quiz: {
            columns: {
              id: true,
              title: true,
              difficulty: true,
              timeLimit: true,
            },
          },
          article: {
            columns: {
              id: true,
              title: true,
              excerpt: true,
              readingTimeMinutes: true,
            },
          },
        },
      };
    }

    // Fetch trail without prerequisites first
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
      with: withClause,
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    // Fetch prerequisites separately to avoid nested relation issues
    const prerequisitesData = await db.query.trailPrerequisites.findMany({
      where: eq(trailPrerequisites.trailId, trailId),
      with: {
        prerequisiteTrail: {
          columns: {
            id: true,
            name: true,
            difficulty: true,
            status: true,
          },
        },
      },
    });

    // Combine the results
    return {
      ...trail,
      prerequisites: prerequisitesData,
    };
  }

  static async createTrail(newTrail: CreateTrailBody, authorId: string) {
    // Generate a unique trail_id from the name
    const baseSlug = newTrail.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    // Ensure uniqueness by checking if it exists, and append a number if needed
    let trailId = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await db.query.trails.findFirst({
        where: eq(trails.trailId, trailId),
      });
      if (!existing) break;
      trailId = `${baseSlug}-${counter}`;
      counter++;
    }

    // Auto-set unlockOrder if not provided
    let unlockOrder = newTrail.unlockOrder;
    if (unlockOrder === undefined || unlockOrder === null) {
      // Find the highest unlockOrder and append after it
      const maxOrder = await db
        .select({ max: sql<number>`COALESCE(MAX(${trails.unlockOrder}), 0)` })
        .from(trails)
        .then(([result]) => result?.max ?? 0);

      unlockOrder = maxOrder + 1;
    } else {
      // Check if unlockOrder is already taken
      const existing = await db.query.trails.findFirst({
        where: eq(trails.unlockOrder, unlockOrder),
      });

      if (existing) {
        throw new ConflictError(
          `Trail with unlock order ${unlockOrder} already exists`,
        );
      }
    }

    // Build the insert values object
    const insertValues = {
      ...newTrail,
      trailId,
      authorId,
      unlockOrder,
      status: newTrail.status ?? "draft",
      passPercentage: newTrail.passPercentage ?? 70,
      attemptsAllowed: newTrail.attemptsAllowed ?? null,
      allowSkipQuestions: newTrail.allowSkipQuestions ?? false,
      showImmediateExplanations: newTrail.showImmediateExplanations ?? true,
      randomizeContentOrder: newTrail.randomizeContentOrder ?? false,
      customCertificate: newTrail.customCertificate ?? false,
      enrolledCount: 0,
      completionRate: 0,
      averageCompletionMinutes: null,
      availableFrom: newTrail.availableFrom
        ? new Date(newTrail.availableFrom)
        : null,
      availableUntil: newTrail.availableUntil
        ? new Date(newTrail.availableUntil)
        : null,
    };

    const [trail] = await db.insert(trails).values(insertValues).returning();

    return trail;
  }

  static async updateTrail(trailId: number, updates: UpdateTrailBody) {
    const existing = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
    });

    if (!existing) {
      throw new NotFoundError("Trail");
    }

    if (updates.unlockOrder !== undefined && updates.unlockOrder !== null) {
      const duplicate = await db.query.trails.findFirst({
        where: and(
          eq(trails.unlockOrder, updates.unlockOrder),
          sql`${trails.id} != ${trailId}`,
        ),
      });

      if (duplicate) {
        throw new ConflictError(
          `Trail with unlock order ${updates.unlockOrder} already exists`,
        );
      }
    }

    const { availableFrom, availableUntil, ...rest } = updates;

    const dbUpdate: any = {
      ...rest,
      updatedAt: new Date(),
    };

    if (availableFrom !== undefined) {
      dbUpdate.availableFrom = availableFrom ? new Date(availableFrom) : null;
    }
    if (availableUntil !== undefined) {
      dbUpdate.availableUntil = availableUntil
        ? new Date(availableUntil)
        : null;
    }

    const [updatedTrail] = await db
      .update(trails)
      .set(dbUpdate)
      .where(eq(trails.id, trailId))
      .returning();

    return updatedTrail;
  }

  static async deleteTrail(trailId: number) {
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    const blockingDependents = await this.getBlockingDependentTrails(trailId);

    if (blockingDependents.length > 0) {
      const dependentTrails = blockingDependents.map((trail) => ({
        id: trail.id,
        name: trail.name,
        status: trail.status,
      }));
      const dependentNames = dependentTrails.map((t) => t.name).join(", ");
      const error = new BusinessLogicError(
        `Cannot delete trail. It is a prerequisite for: ${dependentNames}`,
        "HAS_DEPENDENTS",
      );
      error.details = { dependentTrails };
      throw error;
    }

    await db.delete(trails).where(eq(trails.id, trailId));
  }

  static async publishTrail(trailId: number) {
    return this.updateTrail(trailId, { status: "published" });
  }

  static async archiveTrail(trailId: number) {
    // Check if trail exists
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    // Check if trail has dependent trails (other trails have this as prerequisite)
    const blockingDependents = await this.getBlockingDependentTrails(trailId);

    if (blockingDependents.length > 0) {
      const dependentTrails = blockingDependents.map((trail) => ({
        id: trail.id,
        name: trail.name,
        status: trail.status,
      }));
      const dependentNames = dependentTrails.map((t) => t.name).join(", ");
      const error = new BusinessLogicError(
        `Cannot archive trail. It is a prerequisite for: ${dependentNames}`,
        "HAS_DEPENDENTS",
      );
      error.details = { dependentTrails };
      throw error;
    }

    return this.updateTrail(trailId, { status: "archived" });
  }

  // ===================================
  // Content Management
  // ===================================

  static async addContent(trailId: number, contentData: AddContentBody) {
    // Verify trail exists
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    // Verify content exists based on type
    await this.verifyContentExists(
      contentData.contentType,
      contentData.contentId,
    );

    // Check if content already exists in this trail
    const existing = await this.findTrailContent(
      trailId,
      contentData.contentType,
      contentData.contentId,
    );

    if (existing) {
      throw new ConflictError("This content is already in the trail");
    }

    // Auto-assign sequence if not provided, or find next available if sequence is taken
    let sequence = contentData.sequence;

    if (sequence) {
      // Check if the requested sequence is already taken
      const sequenceTaken = await db.query.trailContent.findFirst({
        where: and(
          eq(trailContent.trailId, trailId),
          eq(trailContent.sequence, sequence),
        ),
      });

      if (sequenceTaken) {
        // Find the next available sequence instead of throwing error
        const maxSequence = await db.query.trailContent.findFirst({
          where: eq(trailContent.trailId, trailId),
          orderBy: [desc(trailContent.sequence)],
        });
        sequence = (maxSequence?.sequence ?? 0) + 1;
      }
    } else {
      // No sequence provided, auto-assign next available
      const maxSequence = await db.query.trailContent.findFirst({
        where: eq(trailContent.trailId, trailId),
        orderBy: [desc(trailContent.sequence)],
      });
      sequence = (maxSequence?.sequence ?? 0) + 1;
    }

    const contentValues: any = {
      trailId,
      sequence,
      isRequired: contentData.isRequired ?? true,
    };

    // Set the appropriate foreign key based on content type
    switch (contentData.contentType) {
      case "question":
        contentValues.questionId = contentData.contentId;
        break;
      case "quiz":
        contentValues.quizId = contentData.contentId;
        break;
      case "article":
        contentValues.articleId = contentData.contentId;
        break;
    }

    const [content] = await db
      .insert(trailContent)
      .values(contentValues)
      .returning();

    return content;
  }

  static async updateContent(
    trailId: number,
    contentId: number,
    updates: UpdateContentBody,
  ) {
    const content = await db.query.trailContent.findFirst({
      where: and(
        eq(trailContent.id, contentId),
        eq(trailContent.trailId, trailId),
      ),
    });

    if (!content) {
      throw new NotFoundError("Trail content");
    }

    // Check if new sequence is already taken by another item
    if (updates.sequence !== undefined) {
      const sequenceTaken = await db.query.trailContent.findFirst({
        where: and(
          eq(trailContent.trailId, trailId),
          eq(trailContent.sequence, updates.sequence),
          sql`${trailContent.id} != ${contentId}`,
        ),
      });

      if (sequenceTaken) {
        throw new ConflictError(
          `Sequence ${updates.sequence} is already taken`,
        );
      }
    }

    const [updated] = await db
      .update(trailContent)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(trailContent.id, contentId))
      .returning();

    return updated;
  }

  static async removeContent(trailId: number, contentId: number) {
    const content = await db.query.trailContent.findFirst({
      where: and(
        eq(trailContent.id, contentId),
        eq(trailContent.trailId, trailId),
      ),
    });

    if (!content) {
      throw new NotFoundError("Trail content");
    }

    await db.delete(trailContent).where(eq(trailContent.id, contentId));
  }

  static async reorderContent(trailId: number, updates: ReorderContentBody) {
    // Verify trail exists
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    // Verify all content items belong to this trail
    const contentIds = updates.contentUpdates.map((u) => u.contentId);
    const contents = await db.query.trailContent.findMany({
      where: and(
        eq(trailContent.trailId, trailId),
        inArray(trailContent.id, contentIds),
      ),
    });

    if (contents.length !== contentIds.length) {
      throw new BadRequestError(
        "Some content items do not belong to this trail",
      );
    }

    // Check for duplicate sequences
    const sequences = updates.contentUpdates.map((u) => u.sequence);
    const uniqueSequences = new Set(sequences);
    if (sequences.length !== uniqueSequences.size) {
      throw new BadRequestError("Duplicate sequences detected");
    }

    // Update all in transaction
    await db.transaction(async (tx) => {
      for (const update of updates.contentUpdates) {
        await tx
          .update(trailContent)
          .set({
            sequence: update.sequence,
            updatedAt: new Date(),
          })
          .where(eq(trailContent.id, update.contentId));
      }
    });

    // Return updated content list
    return db.query.trailContent.findMany({
      where: eq(trailContent.trailId, trailId),
      orderBy: [asc(trailContent.sequence)],
    });
  }

  // ===================================
  // Prerequisites Management
  // ===================================

  static async addPrerequisite(trailId: number, prerequisiteTrailId: number) {
    // Verify both trails exist
    const [trail, prerequisite] = await Promise.all([
      db.query.trails.findFirst({ where: eq(trails.id, trailId) }),
      db.query.trails.findFirst({ where: eq(trails.id, prerequisiteTrailId) }),
    ]);

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    if (!prerequisite) {
      throw new NotFoundError("Prerequisite trail");
    }

    // Check for self-reference
    if (trailId === prerequisiteTrailId) {
      throw new BadRequestError("A trail cannot be its own prerequisite");
    }

    // Check if already exists
    const existing = await db.query.trailPrerequisites.findFirst({
      where: and(
        eq(trailPrerequisites.trailId, trailId),
        eq(trailPrerequisites.prerequisiteTrailId, prerequisiteTrailId),
      ),
    });

    if (existing) {
      throw new ConflictError("This prerequisite already exists");
    }

    // Check for circular dependencies
    const wouldCreateCycle = await this.checkCircularDependency(
      trailId,
      prerequisiteTrailId,
    );

    if (wouldCreateCycle) {
      throw new BusinessLogicError(
        "Adding this prerequisite would create a circular dependency",
        "CIRCULAR_DEPENDENCY",
      );
    }

    await db.insert(trailPrerequisites).values({
      trailId,
      prerequisiteTrailId,
    });
  }

  static async removePrerequisite(
    trailId: number,
    prerequisiteTrailId: number,
  ) {
    const existing = await db.query.trailPrerequisites.findFirst({
      where: and(
        eq(trailPrerequisites.trailId, trailId),
        eq(trailPrerequisites.prerequisiteTrailId, prerequisiteTrailId),
      ),
    });

    if (!existing) {
      throw new NotFoundError("Prerequisite");
    }

    await db
      .delete(trailPrerequisites)
      .where(
        and(
          eq(trailPrerequisites.trailId, trailId),
          eq(trailPrerequisites.prerequisiteTrailId, prerequisiteTrailId),
        ),
      );
  }

  // Helper: Check for circular dependencies
  private static async checkCircularDependency(
    trailId: number,
    newPrerequisiteId: number,
  ): Promise<boolean> {
    // If newPrerequisite already has trailId as its prerequisite (direct or indirect), it's circular
    const visited = new Set<number>();
    const queue = [newPrerequisiteId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // If we encounter the original trail, it's circular
      if (currentId === trailId) return true;

      // Get all prerequisites of current trail
      const prereqs = await db.query.trailPrerequisites.findMany({
        where: eq(trailPrerequisites.trailId, currentId),
      });

      // Add them to queue
      queue.push(...prereqs.map((p) => p.prerequisiteTrailId));
    }

    return false;
  }

  // ===================================
  // Helper Methods
  // ===================================

  private static async verifyContentExists(
    contentType: "question" | "quiz" | "article",
    contentId: number,
  ) {
    let exists = false;

    switch (contentType) {
      case "question":
        exists = !!(await db.query.questions.findFirst({
          where: eq(questions.id, contentId),
        }));
        break;
      case "quiz":
        exists = !!(await db.query.quizzes.findFirst({
          where: eq(quizzes.id, contentId),
        }));
        break;
      case "article":
        exists = !!(await db.query.wikiArticles.findFirst({
          where: eq(wikiArticles.id, contentId),
        }));
        break;
    }

    if (!exists) {
      throw new NotFoundError(
        `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
      );
    }
  }

  private static async findTrailContent(
    trailId: number,
    contentType: "question" | "quiz" | "article",
    contentId: number,
  ) {
    const conditions = [eq(trailContent.trailId, trailId)];

    switch (contentType) {
      case "question":
        conditions.push(eq(trailContent.questionId, contentId));
        break;
      case "quiz":
        conditions.push(eq(trailContent.quizId, contentId));
        break;
      case "article":
        conditions.push(eq(trailContent.articleId, contentId));
        break;
    }

    return db.query.trailContent.findFirst({
      where: and(...conditions),
    });
  }

  /**
   * Get recommended trails for a user based on their activity
   * Recommendations are based on:
   * 1. Categories from completed trails
   * 2. Categories from recently read articles
   * 3. Difficulty progression (next level from completed trails)
   *
   * @param userId - User ID
   * @param limit - Maximum number of recommendations (default: 3)
   * @returns Array of recommended trails
   */
  static async getRecommendedTrails(userId: string, limit: number = 3) {
    // Get user's last completed trail
    const lastCompletedTrail = await db.query.userTrailProgress.findFirst({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.isCompleted, true),
      ),
      orderBy: [desc(userTrailProgress.updatedAt)],
      with: {
        trail: true,
      },
    });

    // Get categories from recently read articles (last 5)
    const recentArticles = await db
      .select({
        categoryId: wikiArticles.categoryId,
      })
      .from(userArticleReads)
      .innerJoin(wikiArticles, eq(wikiArticles.id, userArticleReads.articleId))
      .where(eq(userArticleReads.userId, userId))
      .orderBy(desc(userArticleReads.lastReadAt))
      .limit(5);

    const articleCategoryIds = recentArticles
      .map((a) => a.categoryId)
      .filter((id): id is number => id !== null);

    // Build category filter
    const categoryIds: number[] = [];
    if (lastCompletedTrail?.trail.categoryId) {
      categoryIds.push(lastCompletedTrail.trail.categoryId);
    }
    categoryIds.push(...articleCategoryIds);

    // Get trails user has already completed
    const completedTrailIds = await db
      .select({ trailId: userTrailProgress.trailId })
      .from(userTrailProgress)
      .where(
        and(
          eq(userTrailProgress.userId, userId),
          eq(userTrailProgress.isCompleted, true),
        ),
      );

    const completedIds = completedTrailIds.map((t) => t.trailId);

    // Build conditions for recommendations
    const conditions = [eq(trails.status, "published")];

    // Exclude completed trails
    if (completedIds.length > 0) {
      conditions.push(sql`${trails.id} NOT IN ${completedIds}`);
    }

    // Filter by categories if we have any
    if (categoryIds.length > 0) {
      conditions.push(inArray(trails.categoryId, categoryIds));
    }

    // Get recommended trails
    const recommendedTrails = await db.query.trails.findMany({
      where: and(...conditions),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: true,
      },
      orderBy: [asc(trails.unlockOrder), desc(trails.createdAt)],
      limit,
    });

    // If we don't have enough recommendations, fill with popular trails
    if (recommendedTrails.length < limit) {
      const remaining = limit - recommendedTrails.length;
      const alreadyRecommendedIds = recommendedTrails.map((t) => t.id);

      const popularTrails = await db.query.trails.findMany({
        where: and(
          eq(trails.status, "published"),
          // Exclude completed trails
          completedIds.length > 0
            ? sql`${trails.id} NOT IN ${completedIds}`
            : sql`true`,
          // Exclude already recommended trails
          alreadyRecommendedIds.length > 0
            ? sql`${trails.id} NOT IN ${alreadyRecommendedIds}`
            : sql`true`,
        ),
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: true,
        },
        orderBy: [asc(trails.unlockOrder), desc(trails.createdAt)],
        limit: remaining,
      });

      recommendedTrails.push(...popularTrails);
    }

    return recommendedTrails;
  }

  /**
   * Get recommended categories based on user activity
   * Analyzes completed trails, read articles, and answered questions
   */
  static async getRecommendedCategories(userId: string, limit: number = 6) {
    // Track category scores with recency weighting
    const categoryScores = new Map<
      number,
      { score: number; name: string; slug: string; color: string | null }
    >();

    // Helper to add score to a category
    const addCategoryScore = (
      categoryId: number | null,
      score: number,
      categoryData?: { name: string; slug: string; color: string | null },
    ) => {
      if (!categoryId) return;

      const existing = categoryScores.get(categoryId);
      if (existing) {
        existing.score += score;
      } else if (categoryData) {
        categoryScores.set(categoryId, { score, ...categoryData });
      }
    };

    // 1. Get categories from completed trails (weight: 10 points each)
    const completedTrails = await db.query.userTrailProgress.findMany({
      where: and(
        eq(userTrailProgress.userId, userId),
        eq(userTrailProgress.isCompleted, true),
      ),
      orderBy: [desc(userTrailProgress.updatedAt)],
      limit: 10,
      with: {
        trail: {
          with: {
            category: true,
          },
        },
      },
    });

    completedTrails.forEach((progress, index) => {
      if (progress.trail.category) {
        // More recent completions get higher weight
        const recencyBonus = (10 - index) * 0.5;
        addCategoryScore(progress.trail.categoryId, 10 + recencyBonus, {
          name: progress.trail.category.name,
          slug: progress.trail.category.slug,
          color: progress.trail.category.color,
        });
      }
    });

    // 2. Get categories from read articles (weight: 5 points each)
    const readArticles = await db
      .select({
        categoryId: wikiArticles.categoryId,
        categoryName: wikiArticles.categoryId, // We'll join to get the full category
        lastReadAt: userArticleReads.lastReadAt,
      })
      .from(userArticleReads)
      .innerJoin(wikiArticles, eq(wikiArticles.id, userArticleReads.articleId))
      .where(eq(userArticleReads.userId, userId))
      .orderBy(desc(userArticleReads.lastReadAt))
      .limit(20);

    // Get unique category IDs from articles
    const articleCategoryIds = [
      ...new Set(
        readArticles
          .map((a) => a.categoryId)
          .filter((id): id is number => id !== null),
      ),
    ];

    if (articleCategoryIds.length > 0) {
      const articleCategories = await db.query.contentCategories.findMany({
        where: inArray(contentCategories.id, articleCategoryIds),
      });

      const categoryMap = new Map(articleCategories.map((c) => [c.id, c]));

      readArticles.forEach((article, index) => {
        if (article.categoryId) {
          const category = categoryMap.get(article.categoryId);
          if (category) {
            const recencyBonus = (20 - index) * 0.2;
            addCategoryScore(article.categoryId, 5 + recencyBonus, {
              name: category.name,
              slug: category.slug,
              color: category.color,
            });
          }
        }
      });
    }

    // 3. Get categories from answered questions (weight: 3 points each)
    const answeredQuestions = await db
      .select({
        categoryId: questions.categoryId,
        createdAt: userQuestionAttempts.createdAt,
      })
      .from(userQuestionAttempts)
      .innerJoin(questions, eq(questions.id, userQuestionAttempts.questionId))
      .where(eq(userQuestionAttempts.userId, userId))
      .orderBy(desc(userQuestionAttempts.createdAt))
      .limit(30);

    const questionCategoryIds = [
      ...new Set(
        answeredQuestions
          .map((q) => q.categoryId)
          .filter((id): id is number => id !== null),
      ),
    ];

    if (questionCategoryIds.length > 0) {
      const questionCategories = await db.query.contentCategories.findMany({
        where: inArray(contentCategories.id, questionCategoryIds),
      });

      const categoryMap = new Map(questionCategories.map((c) => [c.id, c]));

      answeredQuestions.forEach((question, index) => {
        if (question.categoryId) {
          const category = categoryMap.get(question.categoryId);
          if (category) {
            const recencyBonus = (30 - index) * 0.1;
            addCategoryScore(question.categoryId, 3 + recencyBonus, {
              name: category.name,
              slug: category.slug,
              color: category.color,
            });
          }
        }
      });
    }

    // Convert map to array and sort by score
    const rankedCategories = Array.from(categoryScores.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        slug: data.slug,
        color: data.color,
        score: data.score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // If we don't have enough recommendations, fill with popular categories
    if (rankedCategories.length < limit) {
      const existingIds = rankedCategories.map((c) => c.id);
      const remaining = limit - rankedCategories.length;

      const popularCategories = await db.query.contentCategories.findMany({
        where: and(
          eq(contentCategories.isActive, true),
          existingIds.length > 0
            ? sql`${contentCategories.id} NOT IN ${existingIds}`
            : sql`true`,
        ),
        orderBy: [asc(contentCategories.name)],
        limit: remaining,
      });

      rankedCategories.push(
        ...popularCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          color: c.color,
          score: 0,
        })),
      );
    }

    return rankedCategories;
  }
}
