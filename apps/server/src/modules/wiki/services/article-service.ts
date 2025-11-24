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
  StudentArticleListItem,
  StudentArticleDetail,
  StudentArticleProgress,
  StudentArticleDifficulty,
  ArticleDifficultyValue,
} from "../types/article";
import { ragQueue } from "@/lib/queue";
import { NoCategoryError } from "../exceptions/no-category-error";
import { ConfigService } from "@/modules/config/config.service";
import { CertificateService } from "@/modules/certificates/certificates.service";

export class ArticleService {
  private static editor: ServerBlockNoteEditor = ServerBlockNoteEditor.create();
  private static readonly difficultyDescriptors: Array<{
    value: ArticleDifficultyValue;
    label: string;
    color: string;
    maxMinutes: number;
  }> = [
    {
      value: "basic",
      label: "Básico",
      color: "#22c55e",
      maxMinutes: 5,
    },
    {
      value: "intermediate",
      label: "Intermediário",
      color: "#f97316",
      maxMinutes: 10,
    },
    {
      value: "advanced",
      label: "Avançado",
      color: "#ef4444",
      maxMinutes: Number.POSITIVE_INFINITY,
    },
  ];

  private static determineDifficulty(
    readingTimeMinutes?: number | null,
  ): StudentArticleDifficulty {
    const minutes = Math.max(1, readingTimeMinutes ?? 1);

    const descriptor =
      this.difficultyDescriptors.find(
        ({ maxMinutes }) => minutes <= maxMinutes,
      ) ?? this.difficultyDescriptors[this.difficultyDescriptors.length - 1];

    return {
      value: descriptor.value,
      label: descriptor.label,
      color: descriptor.color,
    };
  }

  private static defaultProgress(): StudentArticleProgress {
    return {
      isRead: false,
      readPercentage: 0,
      timeSpentSeconds: 0,
      lastReadAt: null,
    };
  }

  private static mapProgressRecord(record?: {
    isRead: boolean | null;
    readPercentage: number | null;
    timeSpentSeconds: number | null;
    lastReadAt: Date | null;
  }): StudentArticleProgress {
    if (!record) {
      return this.defaultProgress();
    }

    return {
      isRead: Boolean(record.isRead),
      readPercentage: record.readPercentage ?? 0,
      timeSpentSeconds: record.timeSpentSeconds ?? 0,
      lastReadAt: record.lastReadAt ? record.lastReadAt.toISOString() : null,
    };
  }

  private static async getStudentArticleMetadata(
    articleIds: number[],
    userId: string,
  ): Promise<{
    bookmarks: Set<number>;
    progressMap: Map<number, StudentArticleProgress>;
  }> {
    if (articleIds.length === 0) {
      return {
        bookmarks: new Set(),
        progressMap: new Map(),
      };
    }

    const [bookmarks, reads] = await Promise.all([
      db
        .select({
          articleId: userArticleBookmarks.articleId,
        })
        .from(userArticleBookmarks)
        .where(
          and(
            eq(userArticleBookmarks.userId, userId),
            inArray(userArticleBookmarks.articleId, articleIds),
          ),
        ),
      db
        .select({
          articleId: userArticleReads.articleId,
          isRead: userArticleReads.isRead,
          readPercentage: userArticleReads.readPercentage,
          timeSpentSeconds: userArticleReads.timeSpentSeconds,
          lastReadAt: userArticleReads.lastReadAt,
        })
        .from(userArticleReads)
        .where(
          and(
            eq(userArticleReads.userId, userId),
            inArray(userArticleReads.articleId, articleIds),
          ),
        ),
    ]);

    const bookmarkSet = new Set<number>(bookmarks.map((b) => b.articleId));
    const progressMap = new Map<number, StudentArticleProgress>();

    for (const read of reads) {
      progressMap.set(
        read.articleId,
        this.mapProgressRecord({
          isRead: read.isRead,
          readPercentage: read.readPercentage,
          timeSpentSeconds: read.timeSpentSeconds,
          lastReadAt: read.lastReadAt,
        }),
      );
    }

    return {
      bookmarks: bookmarkSet,
      progressMap,
    };
  }

  private static mapStudentArticle(
    article: ArticleListItem,
    metadata: {
      bookmarks: Set<number>;
      progressMap: Map<number, StudentArticleProgress>;
    },
  ): StudentArticleListItem {
    const difficulty = this.determineDifficulty(article.readingTimeMinutes);
    const progress =
      metadata.progressMap.get(article.id) ?? this.defaultProgress();

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      sourceType: article.sourceType,
      icon: article.icon ?? null,
      excerpt: article.excerpt,
      readingTimeMinutes: article.readingTimeMinutes,
      featuredImageUrl: article.featuredImageUrl ?? null,

      // External reference fields
      externalUrl: article.externalUrl ?? null,
      externalAuthors: article.externalAuthors ?? null,
      publicationSource: article.publicationSource ?? null,

      category: article.category,
      tags: article.tags,
      difficulty,
      isBookmarked: metadata.bookmarks.has(article.id),
      progress,
    };
  }

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

    const sourceType = data.sourceType || "original";

    // Validate based on source type
    if (sourceType === "external") {
      if (!data.externalUrl) {
        throw new ValidationError(
          "External articles must have an external URL",
        );
      }
      if (!data.externalAuthors || data.externalAuthors.length === 0) {
        throw new ValidationError(
          "External articles must have at least one author",
        );
      }
      // Only validate excerpt for published external articles
      if (data.status === "published") {
        if (!data.excerpt || data.excerpt.length < 50) {
          throw new ValidationError(
            "Published external articles must have an excerpt with at least 50 characters",
          );
        }
      }
    } else {
      // Original article - content is required
      if (!data.content || JSON.stringify(data.content) === "[{}]") {
        // Allow empty content for draft creation
        if (data.status === "published") {
          throw new ValidationError("Published articles must have content");
        }
      }
    }

    const articleData: NewWikiArticle = {
      title: data.title,
      slug,
      sourceType,
      status: data.status || "draft",
      categoryId: data.categoryId,
      authorId,
      featuredImageUrl: data.featuredImageUrl,
      publishedAt: data.status === "published" ? new Date() : null,
      icon: data.icon,
    };

    // Original content fields
    if (sourceType === "original") {
      articleData.content = data.content || [{}];
    }

    // External reference fields
    if (sourceType === "external") {
      articleData.externalUrl = data.externalUrl;
      articleData.externalAuthors = data.externalAuthors;
      articleData.publicationDate = data.publicationDate
        ? new Date(data.publicationDate)
        : null;
      articleData.publicationSource = data.publicationSource;
      articleData.excerpt = data.excerpt;
      articleData.readingTimeMinutes = data.readingTimeMinutes || 5; // Default 5 min if not provided
    }

    try {
      const [article] = await db
        .insert(wikiArticles)
        .values(articleData)
        .returning();

      if (data.tagIds && data.tagIds.length > 0) {
        await this.updateArticleTags(article.id, data.tagIds, authorId);
      }

      // Queue embedding generation for external articles if published
      if (
        sourceType === "external" &&
        data.status === "published" &&
        data.externalUrl
      ) {
        await ragQueue.add("scrape-and-embed", {
          type: "scrape-and-embed",
          articleId: article.id,
          url: data.externalUrl,
        });
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

    const sourceType = existingArticle[0].sourceType;

    // Update content and recalculate metrics (for original articles only)
    if (data.content && sourceType === "original") {
      updateData.content = data.content;

      const markdown = await this.editor.blocksToMarkdownLossy(data.content);
      updateData.contentText = ContentProcessor.decodeHTMLEntities(markdown);

      updateData.readingTimeMinutes = ContentProcessor.calculateReadingTime(
        data.content,
      );

      if (!data.excerpt) {
        updateData.excerpt = ContentProcessor.generateExcerpt(data.content);
      }
    }

    if (sourceType === "external") {
      if (data.externalUrl !== undefined)
        updateData.externalUrl = data.externalUrl;
      if (data.externalAuthors !== undefined)
        updateData.externalAuthors = data.externalAuthors;
      if (data.publicationDate !== undefined)
        updateData.publicationDate = data.publicationDate
          ? new Date(data.publicationDate)
          : null;
      if (data.publicationSource !== undefined)
        updateData.publicationSource = data.publicationSource;
      if (data.readingTimeMinutes !== undefined)
        updateData.readingTimeMinutes = data.readingTimeMinutes;
    }

    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.featuredImageUrl !== undefined)
      updateData.featuredImageUrl = data.featuredImageUrl;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.icon !== undefined) updateData.icon = data.icon;

    if (data.status) {
      const oldStatus = existingArticle[0].status;
      const newStatus = data.status;

      if (newStatus === "published") {
        const categoryId = data.categoryId ?? existingArticle[0].categoryId;

        if (!categoryId) {
          throw new BusinessLogicError(
            "Published articles must have a category",
          );
        }

        // Validate based on source type
        if (sourceType === "original") {
          const content = data.content ?? existingArticle[0].content;
          const contentText = data.content
            ? ContentProcessor.extractPlainText(content)
            : existingArticle[0].contentText;

          if (!contentText || contentText.length < 50) {
            throw new BusinessLogicError(
              "Published articles must have at least 50 characters of content",
            );
          }
        } else if (sourceType === "external") {
          const externalUrl =
            data.externalUrl ?? existingArticle[0].externalUrl;
          const externalAuthors =
            data.externalAuthors ?? existingArticle[0].externalAuthors;
          const excerpt = data.excerpt ?? existingArticle[0].excerpt;

          if (!externalUrl) {
            throw new BusinessLogicError(
              "Published external articles must have an external URL",
            );
          }

          if (!externalAuthors || externalAuthors.length === 0) {
            throw new BusinessLogicError(
              "Published external articles must have at least one author",
            );
          }

          if (excerpt?.length && excerpt.length < 50) {
            throw new BusinessLogicError(
              "Published external articles must have an excerpt with at least 50 characters",
            );
          }
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

      // Queue embedding generation based on source type
      if (sourceType === "original" && data.content) {
        await ragQueue.add("generate-embeddings", {
          type: "generate-embeddings",
          articleId: id,
          content:
            updateData.contentText || existingArticle[0].contentText || "",
        });
      } else if (
        sourceType === "external" &&
        (data.externalUrl || data.status === "published")
      ) {
        // Re-scrape if URL changed or article was just published
        const url = data.externalUrl || existingArticle[0].externalUrl;
        if (url) {
          await ragQueue.add("scrape-and-embed", {
            type: "scrape-and-embed",
            articleId: id,
            url,
          });
        }
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
      sourceType: article.sourceType,
      icon: article.icon || null,
      content: article.content as any[],
      contentText: article.contentText || "",

      // External reference fields
      externalUrl: article.externalUrl,
      externalAuthors: article.externalAuthors,
      publicationDate: article.publicationDate
        ? article.publicationDate.toISOString()
        : null,
      publicationSource: article.publicationSource,

      excerpt: article.excerpt || "",
      metaDescription: article.metaDescription || null,
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
        icon: article.icon || null,
        excerpt: article.excerpt || "",
        status: article.status,
        sourceType: article.sourceType,
        externalUrl: article.externalUrl || null,
        externalAuthors: article.externalAuthors || null,
        publicationSource: article.publicationSource || null,
        publicationDate: article.publicationDate?.toISOString() || null,
        readingTimeMinutes: article.readingTimeMinutes || 1,
        viewCount: article.viewCount,
        featuredImageUrl: article.featuredImageUrl ?? null,
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
        total: Number(count),
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
   * Permanently delete an article (hard delete)
   */
  static async deleteArticle(
    id: number,
  ): Promise<{ message: string; deletedAt: string }> {
    const [article] = await db
      .select()
      .from(wikiArticles)
      .where(eq(wikiArticles.id, id))
      .limit(1);

    if (!article) {
      throw new NotFoundError("Article");
    }

    // Delete related data first (due to foreign key constraints)
    await db.delete(wikiArticleTags).where(eq(wikiArticleTags.articleId, id));
    await db
      .delete(wikiArticleRelationships)
      .where(
        or(
          eq(wikiArticleRelationships.sourceArticleId, id),
          eq(wikiArticleRelationships.targetArticleId, id),
        ),
      );
    await db
      .delete(userArticleBookmarks)
      .where(eq(userArticleBookmarks.articleId, id));
    await db.delete(userArticleReads).where(eq(userArticleReads.articleId, id));

    // Delete the article itself
    await db.delete(wikiArticles).where(eq(wikiArticles.id, id));

    return {
      message: "Article permanently deleted",
      deletedAt: new Date().toISOString(),
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

    if (!article[0].categoryId) {
      throw new BusinessLogicError("Published articles must have a category");
    }

    if (
      article[0].sourceType === "original" &&
      (!article[0].contentText || article[0].contentText.length < 50)
    ) {
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
  static async listPublishedArticles(
    query: ArticleListQuery,
    userId: string,
  ): Promise<{
    articles: StudentArticleListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const baseResult = await this.listArticles({
      ...query,
      status: "published",
    });

    const metadata = await this.getStudentArticleMetadata(
      baseResult.articles.map((article) => article.id),
      userId,
    );

    return {
      articles: baseResult.articles.map((article) =>
        this.mapStudentArticle(article, metadata),
      ),
      pagination: baseResult.pagination,
    };
  }

  /**
   * Get published article by ID (for students)
   */
  static async getPublishedArticleById(
    id: number,
    userId: string,
  ): Promise<StudentArticleDetail> {
    const article = await this.getArticleById(id);

    if (article.status !== "published") {
      throw new NotFoundError("Article");
    }

    // Convert BlockNote content to markdown for mobile rendering
    let contentMarkdown = article.contentText;
    if (
      !contentMarkdown ||
      (Array.isArray(article.content) && article.content.length > 0)
    ) {
      try {
        const markdown = await this.editor.blocksToMarkdownLossy(
          article.content as any[],
        );
        // Decode HTML entities to ensure clean markdown output
        contentMarkdown = ContentProcessor.decodeHTMLEntities(markdown);
      } catch (error) {
        console.error("Failed to convert content to markdown:", error);
        contentMarkdown = article.contentText || "";
      }
    }

    await db
      .update(wikiArticles)
      .set({
        viewCount: sql`${wikiArticles.viewCount} + 1`,
        lastViewedAt: new Date(),
      })
      .where(eq(wikiArticles.id, id));

    const existingRead = await db
      .select({
        id: userArticleReads.id,
        isRead: userArticleReads.isRead,
        readPercentage: userArticleReads.readPercentage,
        timeSpentSeconds: userArticleReads.timeSpentSeconds,
        lastReadAt: userArticleReads.lastReadAt,
      })
      .from(userArticleReads)
      .where(
        and(
          eq(userArticleReads.userId, userId),
          eq(userArticleReads.articleId, id),
        ),
      )
      .limit(1);

    let progressRecord: StudentArticleProgress;

    if (existingRead.length === 0) {
      const [createdProgress] = await db
        .insert(userArticleReads)
        .values({
          userId,
          articleId: id,
          readPercentage: 0,
          timeSpentSeconds: 0,
        })
        .returning({
          isRead: userArticleReads.isRead,
          readPercentage: userArticleReads.readPercentage,
          timeSpentSeconds: userArticleReads.timeSpentSeconds,
          lastReadAt: userArticleReads.lastReadAt,
        });

      progressRecord = this.mapProgressRecord(createdProgress);
    } else {
      const [updatedProgress] = await db
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
        )
        .returning({
          isRead: userArticleReads.isRead,
          readPercentage: userArticleReads.readPercentage,
          timeSpentSeconds: userArticleReads.timeSpentSeconds,
          lastReadAt: userArticleReads.lastReadAt,
        });

      progressRecord = this.mapProgressRecord(updatedProgress);
    }

    const [bookmark] = await db
      .select({
        articleId: userArticleBookmarks.articleId,
      })
      .from(userArticleBookmarks)
      .where(
        and(
          eq(userArticleBookmarks.userId, userId),
          eq(userArticleBookmarks.articleId, id),
        ),
      )
      .limit(1);

    // Override contentText with properly formatted markdown
    const articleWithMarkdown = {
      ...article,
      contentText: contentMarkdown,
    };

    return {
      article: articleWithMarkdown,
      difficulty: this.determineDifficulty(article.readingTimeMinutes),
      isBookmarked: Boolean(bookmark),
      progress: progressRecord,
    };
  }

  static async listStudentCategories(): Promise<
    Array<{
      id: number;
      name: string;
      slug: string;
      color: string;
      articleCount: number;
    }>
  > {
    const rows = await db
      .select({
        id: contentCategories.id,
        name: contentCategories.name,
        slug: contentCategories.slug,
        color: contentCategories.color,
        isActive: contentCategories.isActive,
        articleId: wikiArticles.id,
      })
      .from(contentCategories)
      .leftJoin(
        wikiArticles,
        and(
          eq(wikiArticles.categoryId, contentCategories.id),
          eq(wikiArticles.status, "published" as WikiArticleStatus),
        ),
      )
      .where(eq(contentCategories.isActive, true));

    const summaries = new Map<
      number,
      {
        id: number;
        name: string;
        slug: string;
        color: string;
        articleCount: number;
      }
    >();

    for (const row of rows) {
      const existing = summaries.get(row.id) ?? {
        id: row.id,
        name: row.name,
        slug: row.slug,
        color: row.color || "#3b82f6",
        articleCount: 0,
      };

      if (row.articleId) {
        existing.articleCount += 1;
      }

      summaries.set(row.id, existing);
    }

    return Array.from(summaries.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
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

      // Record activity in gamification system
      try {
        const { DailyActivitiesService } = await import(
          "@/modules/gamification/daily-activities.service"
        );
        await DailyActivitiesService.recordActivity(userId, {
          type: "article",
          metadata: { articleId },
        });
      } catch (error) {
        console.error("Failed to record article activity:", error);
      }

      await this.maybeGenerateCertificateFromArticles(userId);
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

    // Record activity in gamification system (only if not already read)
    if (!existingRead.isRead) {
      try {
        const { DailyActivitiesService } = await import(
          "@/modules/gamification/daily-activities.service"
        );
        await DailyActivitiesService.recordActivity(userId, {
          type: "article",
          metadata: { articleId },
        });
      } catch (error) {
        console.error("Failed to record article activity:", error);
      }
    }

    await this.maybeGenerateCertificateFromArticles(userId);
    return progress;
  }

  /**
   * Mark article as unread
   */
  static async markAsUnread(userId: string, articleId: number) {
    const [progress] = await db
      .update(userArticleReads)
      .set({
        isRead: false,
        readPercentage: 0,
        markedReadAt: null,
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

  private static async maybeGenerateCertificateFromArticles(userId: string) {
    try {
      const config = await ConfigService.getConfig();

      if (
        config.certificateUnlockRequirement !== "articles" &&
        config.certificateUnlockRequirement !== "trails_and_articles"
      ) {
        return;
      }

      const hasCompletedAll =
        await CertificateService.hasCompletedAllArticles(userId);

      if (!hasCompletedAll) {
        return;
      }

      if (
        config.certificateUnlockRequirement === "trails_and_articles" &&
        !(await CertificateService.hasCompletedAllTrails(userId))
      ) {
        return;
      }

      await CertificateService.generateCertificate(userId);
    } catch (error) {
      console.error(
        "Failed to generate certificate after article completion:",
        error,
      );
    }
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
      .leftJoin(wikiArticles, eq(userArticleReads.articleId, wikiArticles.id))
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
