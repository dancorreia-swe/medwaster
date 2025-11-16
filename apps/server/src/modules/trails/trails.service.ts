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
import { wikiArticles } from "@/db/schema/wiki";
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

    // Check if unlockOrder is already taken
    if (newTrail.unlockOrder !== undefined && newTrail.unlockOrder !== null) {
      const existing = await db.query.trails.findFirst({
        where: eq(trails.unlockOrder, newTrail.unlockOrder),
      });

      if (existing) {
        throw new ConflictError(
          `Trail with unlock order ${newTrail.unlockOrder} already exists`,
        );
      }
    }

    // Build the insert values object, only including defined fields
    const insertValues: any = {
      trailId,
      name: newTrail.name,
      difficulty: newTrail.difficulty,
      authorId,
      status: newTrail.status || "draft",
      passPercentage: newTrail.passPercentage ?? 70,
      attemptsAllowed: newTrail.attemptsAllowed ?? 3,
      allowSkipQuestions: newTrail.allowSkipQuestions ?? false,
      showImmediateExplanations: newTrail.showImmediateExplanations ?? true,
      randomizeContentOrder: newTrail.randomizeContentOrder ?? false,
      customCertificate: newTrail.customCertificate ?? false,
      enrolledCount: 0,
      completionRate: 0,
      averageCompletionMinutes: null,
    };

    // Add optional fields only if they are defined
    if (newTrail.description !== undefined) {
      insertValues.description = newTrail.description;
    }
    if (newTrail.categoryId !== undefined) {
      insertValues.categoryId = newTrail.categoryId;
    }
    if (newTrail.unlockOrder !== undefined) {
      insertValues.unlockOrder = newTrail.unlockOrder;
    }
    if (newTrail.timeLimitMinutes !== undefined) {
      insertValues.timeLimitMinutes = newTrail.timeLimitMinutes;
    }
    if (newTrail.coverImageUrl !== undefined) {
      insertValues.coverImageUrl = newTrail.coverImageUrl;
    }
    if (newTrail.themeColor !== undefined) {
      insertValues.themeColor = newTrail.themeColor;
    }
    if (newTrail.estimatedTimeMinutes !== undefined) {
      insertValues.estimatedTimeMinutes = newTrail.estimatedTimeMinutes;
    }
    if (newTrail.availableFrom !== undefined) {
      insertValues.availableFrom = newTrail.availableFrom
        ? new Date(newTrail.availableFrom)
        : null;
    }
    if (newTrail.availableUntil !== undefined) {
      insertValues.availableUntil = newTrail.availableUntil
        ? new Date(newTrail.availableUntil)
        : null;
    }

    const [trail] = await db
      .insert(trails)
      .values(insertValues)
      .returning();

    return trail;
  }

  static async updateTrail(trailId: number, updates: UpdateTrailBody) {
    // Check if trail exists
    const existing = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
    });

    if (!existing) {
      throw new NotFoundError("Trail");
    }

    console.log("🔍 Updating trail:", trailId);
    console.log("📝 Updates:", updates);

    // Check if unlockOrder is already taken by another trail
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

    const updateData: any = { ...updates };

    // Handle date conversions
    if (updates.availableFrom !== undefined) {
      updateData.availableFrom = updates.availableFrom
        ? new Date(updates.availableFrom)
        : null;
    }
    if (updates.availableUntil !== undefined) {
      updateData.availableUntil = updates.availableUntil
        ? new Date(updates.availableUntil)
        : null;
    }

    console.log("💾 Final updateData:", updateData);

    const [updatedTrail] = await db
      .update(trails)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(trails.id, trailId))
      .returning();

    console.log("✅ Updated trail:", updatedTrail);

    return updatedTrail;
  }

  static async deleteTrail(trailId: number) {
    // Check if trail exists
    const trail = await db.query.trails.findFirst({
      where: eq(trails.id, trailId),
    });

    if (!trail) {
      throw new NotFoundError("Trail");
    }

    // Check if trail has dependent trails (other trails have this as prerequisite)
    const dependents = await db.query.trailPrerequisites.findMany({
      where: eq(trailPrerequisites.prerequisiteTrailId, trailId),
      with: {
        trail: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (dependents.length > 0) {
      const dependentNames = dependents.map((d) => d.trail.name).join(", ");
      throw new BusinessLogicError(
        `Cannot delete trail. It is a prerequisite for: ${dependentNames}`,
        "HAS_DEPENDENTS",
      );
    }

    await db.delete(trails).where(eq(trails.id, trailId));
  }

  static async publishTrail(trailId: number) {
    return this.updateTrail(trailId, { status: "published" });
  }

  static async archiveTrail(trailId: number) {
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
      throw new BadRequestError("Some content items do not belong to this trail");
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

  static async addPrerequisite(
    trailId: number,
    prerequisiteTrailId: number,
  ) {
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
}
