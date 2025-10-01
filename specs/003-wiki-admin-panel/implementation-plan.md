# Wiki Admin Panel - Implementation Plan
**Feature**: 003-wiki-admin-panel  
**Created**: 2025-01-26  
**Updated**: 2025-01-26  
**Status**: Planning Complete - Ready for Implementation

## 🎯 **Implementation Overview**

Based on the analysis of requirements (RF025-RF032) and user clarifications:

### **Confirmed Requirements** ✅
1. **Access**: Both admins and super admins can use the wiki panel
2. **Storage**: Start locally, keep extensible for later S3 integration  
3. **Schema**: Create new schema for each domain using existing Drizzle patterns
4. **Editor**: BlockNote.js WYSIWYG editor (https://www.blocknotejs.org/docs/)
5. **PDF Export**: Include PDF export functionality
6. **Error Handling**: Use approved global error handling pattern from existing implementation

### **Architecture Analysis** ✅
- **Current Auth System**: Better Auth with RBAC - `ADMIN` and `SUPER_ADMIN` roles already implemented
- **Error Handling**: Global error handler already implemented with JSON responses and proper HTTP status codes
- **Existing Auth Macro**: `betterAuthMacro` with `auth` and `role` guards ready for use
- **Database**: PostgreSQL with Drizzle ORM patterns established
- **Frontend**: React + TanStack Router + ShadCN UI components ready

### **Technical Stack Integration** ✅
- **Backend**: Elysia + Better Auth + Drizzle ORM (PostgreSQL) - Already established
- **Frontend**: React + TanStack Router + ShadCN UI + Tailwind CSS - Already established
- **Editor**: BlockNote.js WYSIWYG editor (https://www.blocknotejs.org/docs/)
- **File Storage**: Local storage initially, S3-ready architecture
- **PDF Generation**: React-PDF or browser PDF generation for export functionality
- **Error Handling**: Existing global error handler with proper JSON responses

### **Key Implementation Notes** 📋
- **Auth Guards**: Use existing `betterAuthMacro.auth()` and `betterAuthMacro.role(['admin', 'super-admin'])` 
- **Error Responses**: All errors will be handled by global error handler returning JSON format
- **Database Schema**: Follow existing patterns in `apps/server/src/db/schema/`
- **API Endpoints**: Follow existing patterns in `apps/server/src/modules/`
- **Frontend Routes**: Use TanStack Router under `/_auth/admin/wiki/*` paths
- **UI Components**: Leverage existing ShadCN components from `apps/web/src/components/ui/`

## 🗄️ **Database Schema Design**

Based on existing patterns and requirements:

### **1. Wiki Categories Table** 🗂️
```typescript
// apps/server/src/db/schema/wiki.ts
import { pgTable, serial, varchar, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const wikiCategories = pgTable('wiki_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color code #RRGGBB
  parentId: integer('parent_id').references(() => wikiCategories.id),
  level: integer('level').notNull().default(1), // 1, 2, 3 (max 3 levels - per requirements)
  displayOrder: integer('display_order').default(0),
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'inactive'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: varchar('created_by', { length: 255 }).notNull(), // User ID from auth
  updatedBy: varchar('updated_by', { length: 255 })
});
```

### **2. Wiki Tags Table** 🏷️
```typescript
export const wikiTags = pgTable('wiki_tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color code
  category: varchar('category', { length: 50 }).default('wiki'), // 'questions', 'wiki', 'general', 'trails'
  usageCount: integer('usage_count').default(0),
  status: varchar('status', { length: 20 }).default('active'),
  parentTagId: integer('parent_tag_id').references(() => wikiTags.id), // For hierarchical tags (2 levels max)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: varchar('created_by', { length: 255 }).notNull()
});
```

### **3. Enhanced Wiki Articles Table** 📄
```typescript
import { jsonb } from 'drizzle-orm/pg-core';

export const wikiArticles = pgTable('wiki_articles', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(), // URL-friendly version
  content: jsonb('content').notNull(), // BlockNote.js document structure
  contentText: text('content_text'), // Plain text for search (extracted from content)
  excerpt: text('excerpt'), // Short description (first 200 chars or manual)
  readingTime: integer('reading_time'), // Estimated minutes (auto-calculated)
  categoryId: integer('category_id').references(() => wikiCategories.id),
  status: varchar('status', { length: 20 }).default('draft'), // 'draft', 'published', 'archived'
  publishedAt: timestamp('published_at'),
  viewCount: integer('view_count').default(0),
  featured: boolean('featured').default(false),
  metaDescription: text('meta_description'), // For SEO
  coverImageUrl: text('cover_image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  updatedBy: varchar('updated_by', { length: 255 }),
  publishedBy: varchar('published_by', { length: 255 })
});
```

### **4. Article-Tag Junction Table** 🔗
```typescript
export const wikiArticleTags = pgTable('wiki_article_tags', {
  articleId: integer('article_id').notNull().references(() => wikiArticles.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => wikiTags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.articleId, table.tagId] }),
}));
```

### **5. File Uploads Table** 📁
```typescript
export const wikiUploads = pgTable('wiki_uploads', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(), // Stored filename (UUID + ext)
  originalFilename: varchar('original_filename', { length: 255 }).notNull(), // User uploaded name
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storagePath: text('storage_path').notNull(), // /uploads/wiki/2025/01/uuid.ext
  storageType: varchar('storage_type', { length: 20 }).default('local'), // 'local', 's3'
  articleId: integer('article_id').references(() => wikiArticles.id, { onDelete: 'cascade' }),
  uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
```

## 🔧 **Backend Implementation Plan**

### **Phase 1: Core Infrastructure** ✅
- [x] Article CRUD operations (already implemented)
- [x] Authentication and authorization (already implemented)
- [x] Error handling system (already implemented)

### **Phase 2: Enhanced Database Schema** 🚧
- [ ] **Database Migration**
  ```bash
  # Create migration file
  bun run db:generate
  bun run db:migrate
  ```
  - [ ] Create wiki schema tables (categories, tags, articles, uploads, article_tags)
  - [ ] Add proper indexes for performance
  - [ ] Set up foreign key constraints
  
- [ ] **Drizzle Schema Implementation**
  ```typescript
  // apps/server/src/db/schema/wiki.ts
  export * from './wiki-categories';
  export * from './wiki-tags';
  export * from './wiki-articles';
  export * from './wiki-uploads';
  ```

### **Phase 3: API Implementation** 📡

#### **A. Categories Management Module**
```typescript
// apps/server/src/modules/wiki-categories/
├── index.ts      // Elysia routes with auth guards
├── model.ts      // TypeScript types and validation
└── service.ts    // Business logic (abstract class)
```

**Key Routes:**
- `GET /api/wiki/categories` - List all categories (with hierarchy)
- `POST /api/wiki/categories` - Create new category (auth: admin+)
- `PUT /api/wiki/categories/:id` - Update category (auth: admin+)
- `DELETE /api/wiki/categories/:id` - Delete category (auth: admin+)

#### **B. Tags Management Module**
```typescript
// apps/server/src/modules/wiki-tags/
├── index.ts      // Elysia routes with auth guards
├── model.ts      // TypeScript types and validation
└── service.ts    // Business logic (abstract class)
```

**Key Routes:**
- `GET /api/wiki/tags` - List all tags with search/filter
- `POST /api/wiki/tags` - Create new tag (auth: admin+)
- `PUT /api/wiki/tags/:id` - Update tag (auth: admin+)
- `DELETE /api/wiki/tags/:id` - Delete tag (auth: admin+)
- `GET /api/wiki/tags/search` - Auto-complete search

#### **C. Enhanced Articles Module**
```typescript
// Extend existing apps/server/src/modules/wiki/
```

**New Routes:**
- `GET /api/wiki/articles` - Enhanced listing with filters
- `POST /api/wiki/articles` - Create with full metadata
- `PUT /api/wiki/articles/:id` - Update with status changes
- `POST /api/wiki/articles/:id/publish` - Publish workflow
- `POST /api/wiki/articles/:id/unpublish` - Unpublish workflow
- `GET /api/wiki/articles/:id/export-pdf` - PDF export

#### **D. File Upload Module**
```typescript
// apps/server/src/modules/wiki-uploads/
```

**Routes:**
- `POST /api/wiki/uploads` - Upload image/file (auth: admin+)
- `GET /api/wiki/uploads/:id` - Serve file
- `DELETE /api/wiki/uploads/:id` - Delete file (auth: admin+)

### **Error Handling Implementation** ✅
All modules will use existing error handling:

```typescript
// Example usage in service
import { NotFoundError, UnauthorizedError, ValidationError } from '../../lib/errors';

export abstract class WikiArticleService {
  static async getById(id: number): Promise<WikiArticle> {
    const article = await db.select().from(wikiArticles).where(eq(wikiArticles.id, id));
    
    if (!article.length) {
      throw new NotFoundError('Article');
    }
    
    return article[0];
  }
  
  static async publish(id: number, userId: string): Promise<WikiArticle> {
    const article = await this.getById(id);
    
    if (article.status === 'published') {
      throw new ValidationError('Article is already published');
    }
    
    // Update logic...
    return updatedArticle;
  }
}
```

### **Phase 4: Advanced Features** 📋
- [ ] **Content Enhancement**
  - [ ] Reading time calculation (auto-generated based on word count)
  - [ ] Content search (PostgreSQL full-text search)
  - [ ] Slug generation and management (auto from title, editable)
  - [ ] Meta fields for SEO
  
- [ ] **Bulk Operations**
  - [ ] Bulk status changes (draft -> published)
  - [ ] Bulk tag assignment
  - [ ] Bulk category reassignment
  
- [ ] **Analytics & Metrics**
  - [ ] Article view tracking
  - [ ] Content usage statistics
  - [ ] Admin dashboard integration

## 🎨 **Frontend Implementation Plan**

### **Phase 1: Core Admin Interface** 📋

#### **Route Structure**
```typescript
// apps/web/src/routes/_auth.admin.wiki/
├── index.tsx                    // Wiki dashboard overview
├── articles/
│   ├── index.tsx               // Articles listing
│   ├── new.tsx                 // Create new article
│   └── $articleId/
│       ├── edit.tsx            // Edit article
│       └── preview.tsx         // Preview article
├── categories/
│   ├── index.tsx               // Categories management
│   └── new.tsx                 // Create category
└── tags/
    ├── index.tsx               // Tags management
    └── new.tsx                 // Create tag
```

#### **Key Features:**
- **Protected Routes**: All under `_auth.admin` layout
- **Role Validation**: Both `admin` and `super-admin` access
- **Responsive Design**: Mobile-first approach
- **Loading States**: Proper skeleton loading

### **Phase 2: Article Management Interface** 📝

#### **A. Articles Listing Component**
```typescript
// apps/web/src/features/wiki/components/ArticlesList.tsx
```

**Features:**
- **Data Table**: ShadCN DataTable with sorting
- **Filters**: Status, category, tags, date range
- **Search**: Real-time search with debouncing
- **Bulk Actions**: Select multiple articles for operations
- **Pagination**: Server-side pagination

#### **B. Article Editor Component**
```typescript
// apps/web/src/features/wiki/components/ArticleEditor.tsx
```

**BlockNote.js Integration:**
```typescript
import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";

export function ArticleEditor({ initialContent, onChange }) {
  const editor = useCreateBlockNote({
    schema: BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
        // Custom blocks for medical waste content
      },
    }),
    initialContent: initialContent || [
      {
        type: "paragraph",
        content: "",
      },
    ],
  });

  return (
    <BlockNoteView
      editor={editor}
      onChange={() => onChange(editor.document)}
      theme="light"
      className="min-h-[400px]"
    />
  );
}
```

**Features:**
- **Rich Text Editing**: Full BlockNote.js capabilities
- **Image Upload**: Drag & drop + paste support
- **Auto-save**: Every 30 seconds or on changes
- **Preview Mode**: Side-by-side or full preview
- **Metadata Editor**: Title, excerpt, SEO fields

#### **C. Content Organization Components**
```typescript
// Category Selector
// apps/web/src/features/wiki/components/CategorySelector.tsx

// Tag Input with Auto-complete
// apps/web/src/features/wiki/components/TagInput.tsx

// Publication Status Controller
// apps/web/src/features/wiki/components/PublicationStatus.tsx
```

### **Phase 3: Advanced Features** ⚡

#### **A. Category Management Interface**
```typescript
// apps/web/src/features/wiki/components/CategoryTree.tsx
```

**Features:**
- **Hierarchical Tree View**: Expandable/collapsible
- **Drag & Drop**: Reorder categories
- **Color Coding**: Visual organization
- **Bulk Operations**: Multi-select actions

#### **B. Tag Management System**
```typescript
// apps/web/src/features/wiki/components/TagManager.tsx
```

**Features:**
- **Tag Analytics**: Usage statistics
- **Bulk Operations**: Merge, delete, reassign
- **Hierarchy Visualization**: Parent-child relationships

#### **C. Export & Analytics**
```typescript
// apps/web/src/features/wiki/components/ExportTools.tsx
```

**PDF Export Implementation:**
```typescript
import { generatePDF } from '../utils/pdf-generator';

export function ExportButton({ article }) {
  const handleExport = async () => {
    try {
      const pdfBlob = await generatePDF(article);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${article.slug}.pdf`;
      link.click();
    } catch (error) {
      // Error handling
    }
  };

  return (
    <Button onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  );
}
```

## 📱 **User Experience Flow**

### **Admin Dashboard Integration**
1. **Navigation Enhancement**
   - Add "Wiki Management" section to admin sidebar
   - Quick action cards for common tasks
   - Recent activity feed

2. **Article Management Workflow**
   ```
   List Articles → Filter/Search → Select Article → Edit/View → Save/Publish
   ```

3. **Content Creation Workflow**
   ```
   New Article → Select Category → Add Tags → Compose Content → Preview → Publish
   ```

## 🔒 **Security & Performance**

### **Security Measures**
- [ ] **File Upload Security**
  - File type validation
  - Size limitations
  - Virus scanning (future)
  - Secure file serving

- [ ] **Content Security**
  - XSS prevention in editor
  - Content sanitization
  - Access control validation

### **Performance Optimizations**
- [ ] **Caching Strategy**
  - Article content caching
  - Category/tag caching
  - Image optimization

- [ ] **Database Optimization**
  - Proper indexing
  - Full-text search indices
  - Query optimization

## 📋 **Implementation Checklist**

### **Immediate Tasks (Next 2-3 hours)**
- [ ] Implement category management (backend + frontend)
- [ ] Enhance tag system integration
- [ ] Create article listing interface
- [ ] Integrate BlockNote.js editor

### **Short-term Tasks (This session)**
- [ ] File upload system
- [ ] Article editor with all features
- [ ] Category/tag management UI
- [ ] Basic PDF export

### **Future Enhancements**
- [ ] Advanced analytics
- [ ] Content versioning
- [ ] Collaborative editing
- [ ] Content approval workflow

## 🎯 **Success Criteria**

**MVP Success Indicators:**
1. Admins can create/edit/publish articles using WYSIWYG editor
2. Content is organized with categories and tags
3. File upload works for images
4. Search and filtering function properly
5. PDF export generates correctly
6. All operations follow approved error handling patterns

**Quality Gates:**
- All new code follows existing patterns
- Error handling is consistent
- UI follows ShadCN/Tailwind patterns
- API responses follow success/error format
- Database migrations are reversible

---

This plan provides a comprehensive roadmap for implementing the Wiki Admin Panel while leveraging existing infrastructure and following established patterns in the codebase.