# Wiki Admin Panel - Detailed Implementation Plan

## Project Overview

Based on the comprehensive analysis of the INSTRUCTIONS.md requirements and the existing codebase, this document provides a detailed implementation plan for the Wiki admin panel, addressing all the technical requirements and user specifications provided.

## Requirements Summary

From our conversation, the key requirements are:
1. **User Access**: For both admins and super admins
2. **File Storage**: Start locally, but keep extensible for S3 integration  
3. **Database Design**: Use existing Drizzle pattern, create new schema for each domain
4. **Editor**: Use BlockNote.js WYSIWYG editor (already installed)
5. **Export**: Include PDF export functionality
6. **Error Handling**: Implement comprehensive error handling following Elysia patterns

## Technical Architecture Review

### Current System Analysis
- **Backend**: Bun + Elysia with Better Auth already configured
- **Frontend**: React + TanStack Router + ShadCN UI components  
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth with RBAC (super-admin, admin, user roles)
- **Error Handling**: Comprehensive HttpError system already implemented
- **Editor**: BlockNote.js v0.40.0 already installed

### Error Handling Enhancement

The current error handling system is already well-implemented. However, I need to address the issues you mentioned:

1. **Auth Response Format**: The current auth.ts throws errors but they come as text, not JSON
2. **Status Code Handling**: Global error handler needs to properly handle status codes
3. **Unauthorized Response**: Should utilize the existing Unauthorized response class

Let me first fix these error handling issues, then proceed with the Wiki implementation.

## Error Handling Improvements

### Issue 1: Auth Macro Response Format

The current auth macro in `/Users/danielmac/Code/college/medwaster/apps/server/src/lib/auth.ts` properly throws `UnauthorizedError` and `ForbiddenError`, which should be handled by the global error handler. The issue might be in how the global error handler is processing these errors.

### Issue 2: Custom Error Response Format

Following the Elysia documentation pattern for custom error responses, we should ensure all errors return JSON format with proper status codes.

## Database Schema Design

### Enhanced Wiki Articles Schema

```sql
-- Enhanced wiki_articles table
CREATE TABLE wiki_articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content JSONB NOT NULL, -- BlockNote.js content structure
  excerpt TEXT, -- Auto-generated or manual excerpt
  meta_description VARCHAR(160), -- SEO meta description
  featured_image_url TEXT,
  
  -- Classification
  category_id INTEGER REFERENCES wiki_categories(id),
  
  -- Status and visibility
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
  is_featured BOOLEAN DEFAULT false,
  
  -- Authorship and tracking
  author_id TEXT NOT NULL REFERENCES users(id),
  last_modified_by TEXT REFERENCES users(id),
  
  -- Content metrics
  reading_time_minutes INTEGER, -- Auto-calculated
  view_count INTEGER DEFAULT 0,
  word_count INTEGER, -- Auto-calculated from content
  
  -- SEO and search
  search_vector TSVECTOR, -- Full-text search
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ, -- When first published
  
  -- Constraints
  CONSTRAINT wiki_articles_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT wiki_articles_reading_time_check CHECK (reading_time_minutes >= 0),
  CONSTRAINT wiki_articles_view_count_check CHECK (view_count >= 0)
);

-- Categories table
CREATE TABLE wiki_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(50), -- Icon identifier
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table (unified system as mentioned in RF065)
CREATE TABLE wiki_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  category VARCHAR(20) NOT NULL DEFAULT 'wiki', -- wiki, questions, general, trails
  parent_tag_id INTEGER REFERENCES wiki_tags(id), -- For hierarchical tags
  usage_count INTEGER DEFAULT 0, -- Denormalized count for performance
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT wiki_tags_category_check CHECK (category IN ('wiki', 'questions', 'general', 'trails'))
);

-- Article-Tags many-to-many relationship
CREATE TABLE wiki_article_tags (
  article_id INTEGER NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES wiki_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_id, tag_id)
);

-- File storage table
CREATE TABLE wiki_files (
  id SERIAL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  
  -- S3/CDN ready fields
  storage_provider VARCHAR(20) NOT NULL DEFAULT 'local', -- local, s3, cdn
  storage_bucket VARCHAR(100), -- For S3
  storage_region VARCHAR(50), -- For S3
  public_url TEXT, -- Full public URL
  
  -- Association and metadata
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  associated_article_id INTEGER REFERENCES wiki_articles(id) ON DELETE SET NULL,
  alt_text TEXT, -- For accessibility
  title TEXT, -- Image title
  description TEXT, -- File description
  
  -- Security and validation
  file_hash VARCHAR(64), -- SHA-256 hash for deduplication
  virus_scan_status VARCHAR(20) DEFAULT 'pending', -- pending, clean, infected
  virus_scan_date TIMESTAMPTZ,
  
  -- Usage tracking
  download_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT wiki_files_size_check CHECK (file_size > 0),
  CONSTRAINT wiki_files_provider_check CHECK (storage_provider IN ('local', 's3', 'cdn')),
  CONSTRAINT wiki_files_scan_check CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'skipped'))
);

-- Indexes for performance
CREATE INDEX idx_wiki_articles_status ON wiki_articles(status);
CREATE INDEX idx_wiki_articles_author ON wiki_articles(author_id);
CREATE INDEX idx_wiki_articles_category ON wiki_articles(category_id);
CREATE INDEX idx_wiki_articles_published_at ON wiki_articles(published_at) WHERE status = 'published';
CREATE INDEX idx_wiki_articles_search ON wiki_articles USING GIN(search_vector);
CREATE INDEX idx_wiki_articles_created_at ON wiki_articles(created_at);

CREATE INDEX idx_wiki_tags_category ON wiki_tags(category);
CREATE INDEX idx_wiki_tags_parent ON wiki_tags(parent_tag_id);
CREATE INDEX idx_wiki_tags_usage ON wiki_tags(usage_count DESC);

CREATE INDEX idx_wiki_files_article ON wiki_files(associated_article_id);
CREATE INDEX idx_wiki_files_uploaded_by ON wiki_files(uploaded_by);
CREATE INDEX idx_wiki_files_provider ON wiki_files(storage_provider);
CREATE INDEX idx_wiki_files_created_at ON wiki_files(created_at);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_wiki_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.excerpt, '') || ' ' ||
    COALESCE(NEW.meta_description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wiki_search_vector_trigger
  BEFORE INSERT OR UPDATE ON wiki_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_wiki_search_vector();

-- Update reading time and word count trigger
CREATE OR REPLACE FUNCTION update_wiki_content_metrics()
RETURNS TRIGGER AS $$
DECLARE
  plain_text TEXT;
  word_count_val INTEGER;
BEGIN
  -- Extract plain text from JSONB content (simplified)
  plain_text := NEW.content::text;
  
  -- Count words (simplified word counting)
  word_count_val := array_length(string_to_array(trim(plain_text), ' '), 1);
  
  -- Calculate reading time (average 200 words per minute)
  NEW.word_count := COALESCE(word_count_val, 0);
  NEW.reading_time_minutes := GREATEST(1, CEILING(COALESCE(word_count_val, 0) / 200.0));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wiki_content_metrics_trigger
  BEFORE INSERT OR UPDATE ON wiki_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_wiki_content_metrics();
```

## Backend Implementation

### 1. Error Handling Improvements

First, let's address the error handling issues:

```typescript
// apps/server/src/lib/auth.ts - Enhanced version
export const betterAuthMacro = new Elysia({
  name: "better-auth",
})
  .mount(auth.handler)
  .error({
    UNAUTHORIZED: UnauthorizedError,
    FORBIDDEN: ForbiddenError,
  })
  .macro({
    auth: {
      async resolve({ request, error }) {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session) {
            return error('UNAUTHORIZED', new UnauthorizedError("Authentication required"));
          }

          return {
            user: session.user,
            session: session.session,
          };
        } catch (err) {
          return error('UNAUTHORIZED', new UnauthorizedError("Invalid session"));
        }
      },
    },
    role: (role: string | string[] | Roles | Roles[]) => ({
      resolve: ({ user, error }) => {
        if (!user) {
          return error('UNAUTHORIZED', new UnauthorizedError("Authentication required"));
        }

        const userRole = user.role || "user";

        // Super admin has access to everything
        if (userRole === ROLES.SUPER_ADMIN) {
          return;
        }

        // Check single role
        if (role && typeof role === "string" && userRole !== role) {
          return error('FORBIDDEN', new ForbiddenError("Insufficient permissions"));
        }

        // Check multiple roles
        if (role && Array.isArray(role) && !role.includes(userRole)) {
          return error('FORBIDDEN', new ForbiddenError("Insufficient permissions"));
        }
      },
    }),
  });
```

### 2. Wiki Domain-Specific Errors

```typescript
// apps/server/src/modules/wiki/errors.ts
import { 
  BadRequestError, 
  NotFoundError, 
  ConflictError, 
  InternalServerError,
  UnprocessableEntityError 
} from "../../lib/errors";

export class ArticleNotFoundError extends NotFoundError {
  constructor(articleId: number | string) {
    super(`Article with ID ${articleId} not found`);
    this.code = "ARTICLE_NOT_FOUND";
  }
}

export class ArticleSlugConflictError extends ConflictError {
  constructor(slug: string) {
    super(`Article with slug '${slug}' already exists`);
    this.code = "ARTICLE_SLUG_CONFLICT";
  }
}

export class FileUploadError extends BadRequestError {
  constructor(reason: string) {
    super(`File upload failed: ${reason}`);
    this.code = "FILE_UPLOAD_ERROR";
  }
}

export class FileNotFoundError extends NotFoundError {
  constructor(fileId: number | string) {
    super(`File with ID ${fileId} not found`);
    this.code = "FILE_NOT_FOUND";
  }
}

export class FileTooLargeError extends BadRequestError {
  constructor(maxSize: string) {
    super(`File size exceeds maximum allowed size of ${maxSize}`);
    this.code = "FILE_TOO_LARGE";
  }
}

export class UnsupportedFileTypeError extends BadRequestError {
  constructor(mimeType: string) {
    super(`File type '${mimeType}' is not supported`);
    this.code = "UNSUPPORTED_FILE_TYPE";
  }
}

export class ContentProcessingError extends InternalServerError {
  constructor(details: string) {
    super(`Content processing failed: ${details}`);
    this.code = "CONTENT_PROCESSING_ERROR";
  }
}

export class ExportGenerationError extends InternalServerError {
  constructor(format: string, reason?: string) {
    super(`Failed to generate ${format} export${reason ? `: ${reason}` : ''}`);
    this.code = "EXPORT_GENERATION_ERROR";
  }
}

export class CategoryNotFoundError extends NotFoundError {
  constructor(categoryId: number) {
    super(`Category with ID ${categoryId} not found`);
    this.code = "CATEGORY_NOT_FOUND";
  }
}

export class TagNotFoundError extends NotFoundError {
  constructor(tagId: number) {
    super(`Tag with ID ${tagId} not found`);
    this.code = "TAG_NOT_FOUND";
  }
}

export class InvalidContentStructureError extends UnprocessableEntityError {
  constructor(reason: string) {
    super(`Invalid article content structure: ${reason}`);
    this.code = "INVALID_CONTENT_STRUCTURE";
  }
}
```

### 3. Enhanced Article Service

```typescript
// apps/server/src/modules/wiki/services/articles.service.ts
import { db } from "../../../db";
import * as schema from "../../../db/schema/wiki";
import { eq, and, desc, asc, like, ilike, sql, count } from "drizzle-orm";
import { ulid } from "ulid";
import { ArticleNotFoundError, ArticleSlugConflictError, ContentProcessingError } from "../errors";
import type { 
  CreateArticleData, 
  UpdateArticleData, 
  ArticleListParams, 
  WikiArticle,
  ArticleListResponse 
} from "../types";

export abstract class WikiArticleService {
  /**
   * List articles with pagination and filtering
   */
  static async list(params: ArticleListParams): Promise<ArticleListResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      categoryId,
      authorId,
      search,
      sort = 'updated_at',
      order = 'desc'
    } = params;

    const offset = (page - 1) * limit;
    
    // Build where conditions
    const conditions = [];
    
    if (status) {
      conditions.push(eq(schema.wikiArticles.status, status));
    }
    
    if (categoryId) {
      conditions.push(eq(schema.wikiArticles.categoryId, categoryId));
    }
    
    if (authorId) {
      conditions.push(eq(schema.wikiArticles.authorId, authorId));
    }
    
    if (search) {
      conditions.push(
        sql`${schema.wikiArticles.searchVector} @@ plainto_tsquery('english', ${search})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(schema.wikiArticles)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    // Build order clause
    const orderColumn = schema.wikiArticles[sort as keyof typeof schema.wikiArticles];
    const orderClause = order === 'asc' ? asc(orderColumn) : desc(orderColumn);

    // Get articles with relationships
    const articles = await db
      .select({
        article: schema.wikiArticles,
        category: schema.wikiCategories,
        author: schema.users,
      })
      .from(schema.wikiArticles)
      .leftJoin(schema.wikiCategories, eq(schema.wikiArticles.categoryId, schema.wikiCategories.id))
      .leftJoin(schema.users, eq(schema.wikiArticles.authorId, schema.users.id))
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    // Get tags for each article
    const articleIds = articles.map(a => a.article.id);
    const articleTags = articleIds.length > 0 ? await db
      .select({
        articleId: schema.wikiArticleTags.articleId,
        tag: schema.wikiTags,
      })
      .from(schema.wikiArticleTags)
      .innerJoin(schema.wikiTags, eq(schema.wikiArticleTags.tagId, schema.wikiTags.id))
      .where(sql`${schema.wikiArticleTags.articleId} = ANY(${articleIds})`) : [];

    // Group tags by article
    const tagsByArticle = articleTags.reduce((acc, { articleId, tag }) => {
      if (!acc[articleId]) acc[articleId] = [];
      acc[articleId].push(tag);
      return acc;
    }, {} as Record<number, typeof schema.wikiTags[]>);

    // Format response
    const formattedArticles = articles.map(({ article, category, author }) => ({
      ...article,
      category,
      author: author ? { id: author.id, name: author.name, email: author.email } : null,
      tags: tagsByArticle[article.id] || [],
    }));

    return {
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: await this.getFilterOptions(),
    };
  }

  /**
   * Get single article by ID
   */
  static async getById(id: number): Promise<WikiArticle> {
    const result = await db
      .select({
        article: schema.wikiArticles,
        category: schema.wikiCategories,
        author: schema.users,
      })
      .from(schema.wikiArticles)
      .leftJoin(schema.wikiCategories, eq(schema.wikiArticles.categoryId, schema.wikiCategories.id))
      .leftJoin(schema.users, eq(schema.wikiArticles.authorId, schema.users.id))
      .where(eq(schema.wikiArticles.id, id))
      .limit(1);

    if (!result[0]) {
      throw new ArticleNotFoundError(id);
    }

    const { article, category, author } = result[0];

    // Get tags
    const tags = await db
      .select({ tag: schema.wikiTags })
      .from(schema.wikiArticleTags)
      .innerJoin(schema.wikiTags, eq(schema.wikiArticleTags.tagId, schema.wikiTags.id))
      .where(eq(schema.wikiArticleTags.articleId, id));

    return {
      ...article,
      category,
      author: author ? { id: author.id, name: author.name, email: author.email } : null,
      tags: tags.map(t => t.tag),
    };
  }

  /**
   * Create new article
   */
  static async create(data: CreateArticleData, authorId: string): Promise<WikiArticle> {
    try {
      // Generate slug if not provided
      const slug = data.slug || this.generateSlug(data.title);
      
      // Check slug uniqueness
      await this.ensureSlugUnique(slug);

      // Validate and process content
      const processedContent = await this.processContent(data.content);

      const articleData = {
        id: ulid(),
        title: data.title,
        slug,
        content: processedContent,
        excerpt: data.excerpt || this.generateExcerpt(processedContent),
        metaDescription: data.metaDescription,
        featuredImageUrl: data.featuredImageUrl,
        categoryId: data.categoryId,
        status: data.status,
        authorId,
        lastModifiedBy: authorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert article
      const insertResult = await db
        .insert(schema.wikiArticles)
        .values(articleData)
        .returning();

      const newArticle = insertResult[0];

      // Add tags if provided
      if (data.tagIds && data.tagIds.length > 0) {
        await this.updateArticleTags(newArticle.id, data.tagIds);
      }

      return await this.getById(newArticle.id);
    } catch (error) {
      if (error.constraint === 'wiki_articles_slug_key') {
        throw new ArticleSlugConflictError(data.slug || this.generateSlug(data.title));
      }
      throw error;
    }
  }

  /**
   * Update existing article
   */
  static async update(id: number, data: UpdateArticleData, userId: string): Promise<WikiArticle> {
    // Check if article exists
    const existing = await this.getById(id);

    // Check slug uniqueness if slug is being changed
    if (data.slug && data.slug !== existing.slug) {
      await this.ensureSlugUnique(data.slug, id);
    }

    const updateData: any = {
      lastModifiedBy: userId,
      updatedAt: new Date(),
    };

    // Only update provided fields
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.content !== undefined) {
      updateData.content = await this.processContent(data.content);
    }
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.featuredImageUrl !== undefined) updateData.featuredImageUrl = data.featuredImageUrl;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.status !== undefined) updateData.status = data.status;

    // Update article
    await db
      .update(schema.wikiArticles)
      .set(updateData)
      .where(eq(schema.wikiArticles.id, id));

    // Update tags if provided
    if (data.tagIds !== undefined) {
      await this.updateArticleTags(id, data.tagIds);
    }

    return await this.getById(id);
  }

  /**
   * Soft delete article (set status to archived)
   */
  static async delete(id: number, userId: string): Promise<void> {
    await this.update(id, { status: 'archived' }, userId);
  }

  /**
   * Publish article
   */
  static async publish(id: number, userId: string): Promise<WikiArticle> {
    const existing = await this.getById(id);
    
    const updateData: any = {
      status: 'published',
      lastModifiedBy: userId,
      updatedAt: new Date(),
    };

    // Set published date if first time publishing
    if (existing.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    await db
      .update(schema.wikiArticles)
      .set(updateData)
      .where(eq(schema.wikiArticles.id, id));

    return await this.getById(id);
  }

  /**
   * Duplicate article
   */
  static async duplicate(id: number, userId: string): Promise<WikiArticle> {
    const original = await this.getById(id);
    
    const duplicateData: CreateArticleData = {
      title: `${original.title} (Copy)`,
      content: original.content,
      excerpt: original.excerpt,
      metaDescription: original.metaDescription,
      categoryId: original.categoryId,
      status: 'draft',
      tagIds: original.tags.map(tag => tag.id),
    };

    return await this.create(duplicateData, userId);
  }

  // Helper methods
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private static async ensureSlugUnique(slug: string, excludeId?: number): Promise<void> {
    const conditions = [eq(schema.wikiArticles.slug, slug)];
    if (excludeId) {
      conditions.push(sql`${schema.wikiArticles.id} != ${excludeId}`);
    }

    const existing = await db
      .select({ id: schema.wikiArticles.id })
      .from(schema.wikiArticles)
      .where(and(...conditions))
      .limit(1);

    if (existing.length > 0) {
      throw new ArticleSlugConflictError(slug);
    }
  }

  private static async processContent(content: any): Promise<any> {
    try {
      // Validate BlockNote content structure
      if (!content || typeof content !== 'object' || content.type !== 'doc') {
        throw new ContentProcessingError('Invalid BlockNote content structure');
      }

      // Here you can add additional content processing:
      // - Sanitize HTML
      // - Process image URLs
      // - Extract links
      // - Validate structure

      return content;
    } catch (error) {
      throw new ContentProcessingError(error.message);
    }
  }

  private static generateExcerpt(content: any): string {
    try {
      // Extract plain text from BlockNote content (simplified)
      const plainText = this.extractPlainText(content);
      return plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
    } catch {
      return '';
    }
  }

  private static extractPlainText(content: any): string {
    if (!content?.content) return '';
    
    let text = '';
    
    for (const block of content.content) {
      if (block.content) {
        for (const inline of block.content) {
          if (inline.type === 'text') {
            text += inline.text + ' ';
          }
        }
      }
    }
    
    return text.trim();
  }

  private static async updateArticleTags(articleId: number, tagIds: number[]): Promise<void> {
    // Remove existing tags
    await db
      .delete(schema.wikiArticleTags)
      .where(eq(schema.wikiArticleTags.articleId, articleId));

    // Add new tags
    if (tagIds.length > 0) {
      const tagData = tagIds.map(tagId => ({
        articleId,
        tagId,
        createdAt: new Date(),
      }));

      await db
        .insert(schema.wikiArticleTags)
        .values(tagData);
    }
  }

  private static async getFilterOptions() {
    const [categories, authors, statuses] = await Promise.all([
      db
        .select({ id: schema.wikiCategories.id, name: schema.wikiCategories.name })
        .from(schema.wikiCategories)
        .where(eq(schema.wikiCategories.isActive, true))
        .orderBy(asc(schema.wikiCategories.displayOrder)),
      
      db
        .select({ 
          id: schema.users.id, 
          name: schema.users.name 
        })
        .from(schema.users)
        .innerJoin(
          schema.wikiArticles, 
          eq(schema.users.id, schema.wikiArticles.authorId)
        )
        .groupBy(schema.users.id, schema.users.name),
      
      Promise.resolve(['draft', 'published', 'archived'])
    ]);

    return { categories, authors, statuses };
  }
}
```

This is just the beginning of the comprehensive implementation. The plan includes:

1. **Enhanced Error Handling** - Custom error classes with proper JSON responses
2. **Robust Database Schema** - Complete schema with all necessary indexes and triggers  
3. **Service Layer** - Comprehensive article management with full CRUD operations
4. **File Management** - Local storage with S3 extensibility
5. **Export Functionality** - PDF generation using jsPDF/Puppeteer
6. **Frontend Components** - React components using BlockNote.js editor

Would you like me to continue with the implementation, starting with fixing the error handling issues and then proceeding with the complete Wiki admin panel? I can implement this step by step, ensuring each part works correctly before moving to the next.