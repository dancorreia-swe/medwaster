import { ServerBlockNoteEditor } from "@blocknote/server-util";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  wikiArticles,
  wikiArticleTags,
  wikiArticleRelationships,
  userArticleBookmarks,
  userArticleReads,
  type NewWikiArticle,
  type WikiArticleStatus,
} from "@/db/schema/wiki";
import { contentCategories } from "@/db/schema/categories";
import { tags } from "@/db/schema/questions";
import { user } from "@/db/schema/auth";
import {
  ContentProcessor,
  generateSlug,
  ensureUniqueSlug,
} from "./content-processor";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessLogicError,
} from "@/lib/errors";
import type {
  CreateArticleData,
  UpdateArticleData,
  ArticleListQuery,
  ArticleListItem,
  ArticleDetail,
} from "../types/article";
import { ragQueue } from "@/lib/queue";
import { NoCategoryError } from "../exceptions/no-category-error";

export class ArticleService {
  private static editor: ServerBlockNoteEditor = ServerBlockNoteEditor.create();

  /**
   * Create a new wiki article
   */
  static async createArticle(
    data: CreateArticleData,
    authorId: string,
  ): Promise<ArticleDetail> {
    const baseSlug = generateSlug(data.title);

    const existingSlugs = await db
      .select({ slug: wikiArticles.slug })
      .from(wikiArticles)
      .then((results) => results.map((r) => r.slug));

    const slug = ensureUniqueSlug(baseSlug, existingSlugs);

    if (data.categoryId) {
      const category = await db
        .select()
        .from(contentCategories)
        .where(
          and(
            eq(contentCategories.id, data.categoryId),
            eq(contentCategories.type, "wiki"),
            eq(contentCategories.isActive, true),
          ),
        )
        .limit(1);

      if (category.length === 0) {
        throw new ValidationError("Category not found or not active", {
          categoryId: data.categoryId,
        });
      }
    }

    const articleData: NewWikiArticle = {
      title: data.title,
      slug,
      content: [{}],
      status: data.status || "draft",
      categoryId: data.categoryId,
      authorId,
      featuredImageUrl: data.featuredImageUrl,
      publishedAt: data.status === "published" ? new Date() : null,
    };

    try {
      const [article] = await db
        .insert(wikiArticles)
        .values(articleData)
        .returning();

      if (data.tagIds && data.tagIds.length > 0) {
        await this.updateArticleTags(article.id, data.tagIds, authorId);
      }

      const createdArticle = await this.getArticleById(article.id);

      return createdArticle;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("unique constraint")
      ) {
        throw new ConflictError("Article with this slug already exists", {
          slug,
        });
      }
      throw error;
    }
  }

  /**
   * Update an existing article
   */
  static async updateArticle(
    id: number,
    data: UpdateArticleData,
    authorId: string,
  ): Promise<ArticleDetail> {
    const existingArticle = await db
      .select()
      .from(wikiArticles)
      .where(eq(wikiArticles.id, id))
      .limit(1);

    if (existingArticle.length === 0) {
      throw new NotFoundError("Article");
    }

    const updateData: Partial<NewWikiArticle> = {
      updatedAt: new Date(),
    };

    if (data.title && data.title !== existingArticle[0].title) {
      const baseSlug = generateSlug(data.title);
      const existingSlugs = await db
        .select({ slug: wikiArticles.slug })
        .from(wikiArticles)
        .where(sql`${wikiArticles.id} != ${id}`)
        .then((results) => results.map((r) => r.slug));

      updateData.title = data.title;
      updateData.slug = ensureUniqueSlug(baseSlug, existingSlugs);
    }

    // Update content and recalculate metrics
    if (data.content) {
      updateData.content = data.content;

      updateData.contentText = await this.editor.blocksToMarkdownLossy(
        data.content,
      );

      updateData.readingTimeMinutes = ContentProcessor.calculateReadingTime(
        data.content,
      );

      if (!data.excerpt) {
        updateData.excerpt = ContentProcessor.generateExcerpt(data.content);
      }
    }

    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.featuredImageUrl !== undefined)
      updateData.featuredImageUrl = data.featuredImageUrl;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

    if (data.status) {
      const oldStatus = existingArticle[0].status;
      const newStatus = data.status;

      if (newStatus === "published") {
        const categoryId = data.categoryId ?? existingArticle[0].categoryId;
        const content = data.content ?? existingArticle[0].content;

        if (!categoryId) {
          throw new BusinessLogicError(
            "Published articles must have a category",
          );
        }

        const contentText = data.content
          ? ContentProcessor.extractPlainText(content)
          : existingArticle[0].contentText;

        if (!contentText || contentText.length < 50) {
          throw new BusinessLogicError(
            "Published articles must have at least 50 characters of content",
          );
        }

        if (oldStatus !== "published") {
          updateData.publishedAt = new Date();
        }
      } else if (newStatus === "draft" && oldStatus === "published") {
        updateData.publishedAt = null;
      }

      updateData.status = newStatus;
    }

    if (data.categoryId) {
      const category = await db
        .select()
        .from(contentCategories)
        .where(
          and(
            eq(contentCategories.id, data.categoryId),
            eq(contentCategories.type, "wiki"),
            eq(contentCategories.isActive, true),
          ),
        )
        .limit(1);

      if (category.length === 0) {
        throw new ValidationError("Category not found or not active", {
          categoryId: data.categoryId,
        });
      }
    }

    try {
      // Update article
      await db
        .update(wikiArticles)
        .set(updateData)
        .where(eq(wikiArticles.id, id));

      // Update tags if provided
      if (data.tagIds !== undefined) {
        await this.updateArticleTags(id, data.tagIds, authorId);
      }

      const updatedArticle = await this.getArticleById(id);

      if (data.content) {
        await ragQueue.add("generate-embeddings", {
          type: "generate-embeddings",
          articleId: id,
          content:
            updateData.contentText || existingArticle[0].contentText || "",
        });
      }

      return updatedArticle;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("unique constraint")
      ) {
        throw new ConflictError("Article with this slug already exists", {
          slug: updateData.slug,
        });
      }
      throw error;
    }
  }

  /**
   * Get article by ID with full details
   */
  static async getArticleById(id: number): Promise<ArticleDetail> {
    const result = await db
      .select({
        article: wikiArticles,
        category: contentCategories,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(wikiArticles)
      .leftJoin(
        contentCategories,
        eq(wikiArticles.categoryId, contentCategories.id),
      )
      .leftJoin(user, eq(wikiArticles.authorId, user.id))
      .where(eq(wikiArticles.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError("Article");
    }

    const { article, category, author } = result[0];

    if (!author) {
      throw new NotFoundError("Article author");
    }

    // Get article tags
    const articleTags = await db
      .select({
        tag: tags,
      })
      .from(wikiArticleTags)
      .leftJoin(tags, eq(wikiArticleTags.tagId, tags.id))
      .where(eq(wikiArticleTags.articleId, id));

    // Get relationships
    const relationships = await this.getArticleRelationships(id);

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content as object,
      contentText: article.contentText || "",
      excerpt: article.excerpt || "",
      featuredImageUrl: article.featuredImageUrl,
      status: article.status,
      readingTimeMinutes: article.readingTimeMinutes || 1,
      viewCount: article.viewCount,
      category: category
        ? {
            id: category.id,
            name: category.name,
            color: category.color || "#3b82f6",
          }
        : null,
      author: {
        id: author.id,
        name: author.name,
        email: author.email,
      },
      tags: articleTags
        .filter(({ tag }) => tag !== null)
        .map(({ tag }) => ({
          id: tag!.id,
          name: tag!.name,
          color: tag!.color || "#6b7280",
        })),
      relationships,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString() || null,
      lastViewedAt: article.lastViewedAt?.toISOString() || null,
    };
  }

  /**
   * List articles with filtering and pagination
   */
  static async listArticles(query: ArticleListQuery): Promise<{
    articles: ArticleListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50);
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    if (query.status && query.status !== "all") {
      whereConditions.push(
        eq(wikiArticles.status, query.status as WikiArticleStatus),
      );
    }

    if (query.categoryId) {
      whereConditions.push(eq(wikiArticles.categoryId, query.categoryId));
    }

    if (query.authorId) {
      whereConditions.push(eq(wikiArticles.authorId, query.authorId));
    }

    if (query.search) {
      whereConditions.push(
        or(
          ilike(wikiArticles.title, `%${query.search}%`),
          ilike(wikiArticles.contentText, `%${query.search}%`),
        ),
      );
    }

    // Handle tag filtering
    let tagArticleIds: number[] = [];
    if (query.tags && query.tags.length > 0) {
      const tagResults = await db
        .select({ articleId: wikiArticleTags.articleId })
        .from(wikiArticleTags)
        .leftJoin(tags, eq(wikiArticleTags.tagId, tags.id))
        .where(inArray(tags.name, query.tags));

      tagArticleIds = tagResults.map((r) => r.articleId);

      if (tagArticleIds.length > 0) {
        whereConditions.push(inArray(wikiArticles.id, tagArticleIds));
      } else {
        // No articles found with these tags
        return {
          articles: [],
          pagination: { page, limit, total: 0, pages: 0 },
        };
      }
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(wikiArticles)
      .where(whereClause);

    // Build order by clause
    const orderBy = [];
    const sortField = query.sort || "updated_at";
    const sortOrder = query.order || "desc";

    switch (sortField) {
      case "title":
        orderBy.push(
          sortOrder === "asc" ? wikiArticles.title : desc(wikiArticles.title),
        );
        break;
      case "created_at":
        orderBy.push(
          sortOrder === "asc"
            ? wikiArticles.createdAt
            : desc(wikiArticles.createdAt),
        );
        break;
      case "view_count":
        orderBy.push(
          sortOrder === "asc"
            ? wikiArticles.viewCount
            : desc(wikiArticles.viewCount),
        );
        break;
      default:
        orderBy.push(
          sortOrder === "asc"
            ? wikiArticles.updatedAt
            : desc(wikiArticles.updatedAt),
        );
    }

    // Get articles
    const results = await db
      .select({
        article: wikiArticles,
        category: contentCategories,
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(wikiArticles)
      .leftJoin(
        contentCategories,
        eq(wikiArticles.categoryId, contentCategories.id),
      )
      .leftJoin(user, eq(wikiArticles.authorId, user.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    // Get tags for each article
    const articleIds = results.map((r) => r.article.id);
    const articleTagsMap: Record<
      number,
      Array<{ id: number; name: string; color: string }>
    > = {};

    if (articleIds.length > 0) {
      const articleTags = await db
        .select({
          articleId: wikiArticleTags.articleId,
          tag: tags,
        })
        .from(wikiArticleTags)
        .leftJoin(tags, eq(wikiArticleTags.tagId, tags.id))
        .where(inArray(wikiArticleTags.articleId, articleIds));

      for (const { articleId, tag } of articleTags) {
        if (!articleTagsMap[articleId]) {
          articleTagsMap[articleId] = [];
        }
        if (tag) {
          articleTagsMap[articleId].push({
            id: tag.id,
            name: tag.name,
            color: tag.color || "#6b7280",
          });
        }
      }
    }

    const articles: ArticleListItem[] = results
      .filter(({ author }) => author !== null)
      .map(({ article, category, author }) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || "",
        status: article.status,
        readingTimeMinutes: article.readingTimeMinutes || 1,
        viewCount: article.viewCount,
        category: category
          ? {
              id: category.id,
              name: category.name,
              color: category.color || "#3b82f6",
            }
          : null,
        author: {
          id: author!.id,
          name: author!.name,
          email: author!.email,
        },
        tags: articleTagsMap[article.id] || [],
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
        publishedAt: article.publishedAt?.toISOString() || null,
      }));

    return {
      articles,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get global stats for articles
   */
  static async getStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    viewsTotal: number;
  }> {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(wikiArticles);

    const [{ published }] = await db
      .select({ published: sql<number>`count(*)` })
      .from(wikiArticles)
      .where(eq(wikiArticles.status, "published" as WikiArticleStatus));

    const [{ draft }] = await db
      .select({ draft: sql<number>`count(*)` })
      .from(wikiArticles)
      .where(eq(wikiArticles.status, "draft" as WikiArticleStatus));

    const [{ archived }] = await db
      .select({ archived: sql<number>`count(*)` })
      .from(wikiArticles)
      .where(eq(wikiArticles.status, "archived" as WikiArticleStatus));

    const [{ viewsTotal }] = await db
      .select({
        viewsTotal: sql<number>`COALESCE(SUM(${wikiArticles.viewCount}), 0)`,
      })
      .from(wikiArticles);

    return { total, published, draft, archived, viewsTotal };
  }

  /**
   * Soft delete article (archive)
   */
  static async archiveArticle(
    id: number,
  ): Promise<{ message: string; archivedAt: string }> {
    const result = await db
      .update(wikiArticles)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(wikiArticles.id, id))
      .returning({ id: wikiArticles.id });

    if (result.length === 0) {
      throw new NotFoundError("Article");
    }

    return {
      message: "Article archived successfully",
      archivedAt: new Date().toISOString(),
    };
  }

  /**
   * Publish article
   */
  static async publishArticle(id: number): Promise<ArticleDetail> {
    const article = await db
      .select()
      .from(wikiArticles)
      .where(eq(wikiArticles.id, id))
      .limit(1);

    if (article.length === 0) {
      throw new NotFoundError("Article");
    }

    if (article[0].status === "published") {
      throw new BusinessLogicError("Article is already published");
    }

    // Validate publication requirements
    if (!article[0].categoryId) {
      throw new BusinessLogicError("Published articles must have a category");
    }

    if (!article[0].contentText || article[0].contentText.length < 50) {
      throw new BusinessLogicError(
        "Published articles must have at least 50 characters of content",
      );
    }

    await db
      .update(wikiArticles)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wikiArticles.id, id));

    const publishedArticle = await this.getArticleById(id);

    // Dispatch RAG worker to generate embeddings for published article
    await ragQueue.add("generate-embeddings", {
      type: "generate-embeddings",
      articleId: id,
      content: article[0].contentText || "",
    });

    return publishedArticle;
  }

  /**
   * Unpublish article
   */
  static async unpublishArticle(id: number): Promise<ArticleDetail> {
    const article = await db
      .select()
      .from(wikiArticles)
      .where(eq(wikiArticles.id, id))
      .limit(1);

    if (article.length === 0) {
      throw new NotFoundError("Article");
    }

    if (article[0].status !== "published") {
      throw new BusinessLogicError("Article is not published");
    }

    await db
      .update(wikiArticles)
      .set({
        status: "draft",
        publishedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(wikiArticles.id, id));

    return this.getArticleById(id);
  }

  /**
   * Update article tags
   */
  private static async updateArticleTags(
    articleId: number,
    tagIds: number[],
    userId: string,
  ): Promise<void> {
    // Remove existing tags
    await db
      .delete(wikiArticleTags)
      .where(eq(wikiArticleTags.articleId, articleId));

    // Add new tags
    if (tagIds.length > 0) {
      const tagData = tagIds.map((tagId) => ({
        articleId,
        tagId,
        assignedBy: userId,
      }));

      await db.insert(wikiArticleTags).values(tagData);
    }
  }

  /**
   * Get article relationships
   */
  private static async getArticleRelationships(articleId: number) {
    const relationships = await db
      .select({
        type: wikiArticleRelationships.relationshipType,
        targetArticle: {
          id: wikiArticles.id,
          title: wikiArticles.title,
          slug: wikiArticles.slug,
          status: wikiArticles.status,
        },
      })
      .from(wikiArticleRelationships)
      .leftJoin(
        wikiArticles,
        eq(wikiArticleRelationships.targetArticleId, wikiArticles.id),
      )
      .where(eq(wikiArticleRelationships.sourceArticleId, articleId));

    return {
      related: relationships
        .filter((r) => r.type === "related" && r.targetArticle !== null)
        .map((r) => r.targetArticle!),
      prerequisites: relationships
        .filter((r) => r.type === "prerequisite" && r.targetArticle !== null)
        .map((r) => r.targetArticle!),
      continuations: relationships
        .filter((r) => r.type === "continuation" && r.targetArticle !== null)
        .map((r) => r.targetArticle!),
    };
  }

  /**
   * List published articles only (for students)
   */
  static async listPublishedArticles(query: ArticleListQuery) {
    return this.listArticles({
      ...query,
      status: "published",
    });
  }

  /**
   * Get published article by ID (for students)
   */
  static async getPublishedArticleById(id: number, userId: string) {
    const article = await this.getArticleById(id);

    if (article.status !== "published") {
      throw new NotFoundError("Article");
    }

    // Track view
    await db
      .update(wikiArticles)
      .set({
        viewCount: sql`${wikiArticles.viewCount} + 1`,
        lastViewedAt: new Date(),
      })
      .where(eq(wikiArticles.id, id));

    // Create or update reading progress
    const [existingRead] = await db
      .select()
      .from(userArticleReads)
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.articleId, id),
        ),
      )
      .limit(1);

    if (!existingRead) {
      await db.insert(userArticleReads).values({
        userId,
        articleId: id,
        readPercentage: 0,
        timeSpentSeconds: 0,
      });
    } else {
      await db
        .update(userArticleReads)
        .set({
          lastReadAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userArticleReads.userId, userId),
            eq(userArticleReads.articleId, id),
          ),
        );
    }

    return article;
  }

  /**
   * Add favorite (bookmark)
   */
  static async addBookmark(userId: string, articleId: number) {
    const [existingBookmark] = await db
      .select()
      .from(userArticleBookmarks)
      .where(
        and(
          eq(userArticleBookmarks.userId, userId),
          eq(userArticleBookmarks.articleId, articleId),
        ),
      )
      .limit(1);

    if (existingBookmark) {
      throw new ConflictError("Article already favorited");
    }

    const [bookmark] = await db
      .insert(userArticleBookmarks)
      .values({
        userId,
        articleId,
      })
      .returning();

    return bookmark;
  }

  /**
   * Remove favorite (bookmark)
   */
  static async removeBookmark(userId: string, articleId: number) {
    const result = await db
      .delete(userArticleBookmarks)
      .where(
        and(
          eq(userArticleBookmarks.userId, userId),
          eq(userArticleBookmarks.articleId, articleId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundError("Favorite");
    }
  }

  /**
   * Get user favorites (bookmarks)
   */
  static async getUserBookmarks(userId: string) {
    const bookmarks = await db
      .select({
        bookmark: userArticleBookmarks,
        article: wikiArticles,
        category: contentCategories,
      })
      .from(userArticleBookmarks)
      .leftJoin(
        wikiArticles,
        eq(userArticleBookmarks.articleId, wikiArticles.id),
      )
      .leftJoin(
        contentCategories,
        eq(wikiArticles.categoryId, contentCategories.id),
      )
      .where(eq(userArticleBookmarks.userId, userId))
      .orderBy(desc(userArticleBookmarks.createdAt));

    return bookmarks.map(({ bookmark, article, category }) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: category
        ? {
            id: category.id,
            name: category.name,
            color: category.color || "#3b82f6",
          }
        : null,
      favoritedAt: bookmark.createdAt.toISOString(),
    }));
  }

  /**
   * Update read progress
   */
  static async updateReadProgress(
    userId: string,
    articleId: number,
    data: { readPercentage: number; timeSpentSeconds: number },
  ) {
    const [existingRead] = await db
      .select()
      .from(userArticleReads)
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.articleId, articleId),
        ),
      )
      .limit(1);

    if (!existingRead) {
      const [progress] = await db
        .insert(userArticleReads)
        .values({
          userId,
          articleId,
          readPercentage: data.readPercentage,
          timeSpentSeconds: data.timeSpentSeconds,
        })
        .returning();

      return progress;
    }

    const [progress] = await db
      .update(userArticleReads)
      .set({
        readPercentage: data.readPercentage,
        timeSpentSeconds: sql`${userArticleReads.timeSpentSeconds} + ${data.timeSpentSeconds}`,
        lastReadAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.articleId, articleId),
        ),
      )
      .returning();

    return progress;
  }

  /**
   * Mark article as read
   */
  static async markAsRead(userId: string, articleId: number) {
    const [existingRead] = await db
      .select()
      .from(userArticleReads)
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.articleId, articleId),
        ),
      )
      .limit(1);

    if (!existingRead) {
      const [progress] = await db
        .insert(userArticleReads)
        .values({
          userId,
          articleId,
          isRead: true,
          readPercentage: 100,
          markedReadAt: new Date(),
        })
        .returning();

      return progress;
    }

    const [progress] = await db
      .update(userArticleReads)
      .set({
        isRead: true,
        readPercentage: 100,
        markedReadAt: new Date(),
        lastReadAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.articleId, articleId),
        ),
      )
      .returning();

    return progress;
  }

  /**
   * Get reading list (articles in progress or not started)
   */
  static async getReadingList(userId: string) {
    const articles = await db
      .select({
        article: wikiArticles,
        category: contentCategories,
        progress: userArticleReads,
      })
      .from(wikiArticles)
      .leftJoin(
        contentCategories,
        eq(wikiArticles.categoryId, contentCategories.id),
      )
      .leftJoin(
        userArticleReads,
        and(
          eq(userArticleReads.articleId, wikiArticles.id),
          eq(userArticleReads.userId, userId),
        ),
      )
      .where(
        and(
          eq(wikiArticles.status, "published"),
          or(
            eq(userArticleReads.isRead, false),
            sql`${userArticleReads.isRead} IS NULL`,
          ),
        ),
      )
      .orderBy(desc(wikiArticles.publishedAt));

    return articles.map(({ article, category, progress }) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      readingTimeMinutes: article.readingTimeMinutes,
      category: category
        ? {
            id: category.id,
            name: category.name,
            color: category.color || "#3b82f6",
          }
        : null,
      progress: progress
        ? {
            readPercentage: progress.readPercentage,
            timeSpentSeconds: progress.timeSpentSeconds,
            lastReadAt: progress.lastReadAt.toISOString(),
          }
        : null,
    }));
  }

  /**
   * Get reading history (completed articles)
   */
  static async getReadingHistory(userId: string) {
    const articles = await db
      .select({
        article: wikiArticles,
        category: contentCategories,
        progress: userArticleReads,
      })
      .from(userArticleReads)
      .leftJoin(
        wikiArticles,
        eq(userArticleReads.articleId, wikiArticles.id),
      )
      .leftJoin(
        contentCategories,
        eq(wikiArticles.categoryId, contentCategories.id),
      )
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.isRead, true),
        ),
      )
      .orderBy(desc(userArticleReads.markedReadAt));

    return articles.map(({ article, category, progress }) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: category
        ? {
            id: category.id,
            name: category.name,
            color: category.color || "#3b82f6",
          }
        : null,
      readingStats: {
        timeSpentSeconds: progress.timeSpentSeconds,
        markedReadAt: progress.markedReadAt?.toISOString(),
        firstReadAt: progress.firstReadAt.toISOString(),
      },
    }));
  }
}
