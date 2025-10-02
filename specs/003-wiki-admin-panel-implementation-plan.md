# Wiki Admin Panel - Detailed Implementation Plan

## Overview
Implementation of RF025-RF037 from INSTRUCTIONS.md - a comprehensive Wiki administration panel for medical waste disposal education content.

## Technical Stack
- **Frontend**: React + TanStack Router + ShadCN UI + BlockNote.js WYSIWYG editor
- **Backend**: Bun + Elysia + Better Auth + Drizzle ORM + PostgreSQL
- **File Storage**: Local filesystem (extensible to S3)
- **PDF Export**: Puppeteer/jsPDF integration
- **API Communication**: Eden Treaty from Elysia

## Phase 1: Error Handling & Auth Improvements

### 1.1 Enhance Error Handling
Based on Elysia docs, implement custom error responses for better JSON handling:

```typescript
// apps/server/src/lib/errors.ts - Add custom error response
export class AuthError extends UnauthorizedError {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

// Update global error handler to use proper status mapping
```

### 1.2 Improve Auth Macro
Update `/Users/danielmac/Code/college/medwaster/apps/server/src/lib/auth.ts` to:
- Utilize proper error throwing instead of returning text responses
- Use Eden Treaty response format
- Implement role-based middleware for admin/super-admin access

## Phase 2: Database Schema & Backend Services

### 2.1 Wiki Database Schema
Extend existing Drizzle schema:

```sql
-- Wiki Articles
CREATE TABLE wiki_articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content JSONB NOT NULL, -- BlockNote content
  excerpt TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, archived
  featured_image_url TEXT,
  meta_description VARCHAR(160),
  reading_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES wiki_categories(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Wiki Categories
CREATE TABLE wiki_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  slug VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7), -- hex color
  icon VARCHAR(50),
  parent_id INTEGER REFERENCES wiki_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article Tags (Many-to-Many)
CREATE TABLE wiki_article_tags (
  article_id INTEGER REFERENCES wiki_articles(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- File Storage
CREATE TABLE wiki_files (
  id SERIAL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  associated_article_id INTEGER REFERENCES wiki_articles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wiki_articles_status ON wiki_articles(status);
CREATE INDEX idx_wiki_articles_category ON wiki_articles(category_id);
CREATE INDEX idx_wiki_articles_author ON wiki_articles(author_id);
CREATE INDEX idx_wiki_articles_published ON wiki_articles(published_at);
CREATE INDEX idx_wiki_files_article ON wiki_files(associated_article_id);
```

### 2.2 Backend Services Structure

```
apps/server/src/modules/wiki/
├── routes/
│   ├── articles.ts      # Article CRUD routes
│   ├── categories.ts    # Category management
│   ├── files.ts         # File upload/management
│   └── export.ts        # PDF export routes
├── services/
│   ├── articles.service.ts    # Article business logic
│   ├── categories.service.ts  # Category management
│   ├── files.service.ts       # File storage handling
│   └── export.service.ts      # PDF export logic
├── schemas/
│   ├── articles.schema.ts     # Validation schemas
│   ├── categories.schema.ts
│   └── files.schema.ts
└── index.ts            # Module entry point
```

## Phase 3: API Endpoints Implementation

### 3.1 Article Management APIs

```typescript
// GET /api/wiki/articles - List with filtering
interface ArticleListParams {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published' | 'archived';
  category?: number;
  author?: string;
  search?: string;
  sort?: 'title' | 'created_at' | 'updated_at' | 'published_at';
  order?: 'asc' | 'desc';
}

// POST /api/wiki/articles - Create article
interface CreateArticleRequest {
  title: string;
  slug?: string;
  content: BlockNoteContent;
  excerpt?: string;
  categoryId?: number;
  tagIds?: number[];
  status: 'draft' | 'published';
  featuredImageUrl?: string;
  metaDescription?: string;
}

// PUT /api/wiki/articles/:id - Update article
// DELETE /api/wiki/articles/:id - Soft delete
// POST /api/wiki/articles/:id/publish - Publish article
// POST /api/wiki/articles/:id/duplicate - Duplicate article
```

### 3.2 File Management APIs

```typescript
// POST /api/wiki/files/upload - File upload
interface FileUploadRequest {
  file: File; // max 5MB
  articleId?: number;
}

// GET /api/wiki/files/:id - Serve file
// DELETE /api/wiki/files/:id - Delete file
```

### 3.3 Export APIs

```typescript
// GET /api/wiki/articles/:id/export/pdf
interface PDFExportParams {
  includeImages?: boolean;
  format?: 'A4' | 'Letter';
}
```

## Phase 4: Frontend Implementation

### 4.1 Route Structure

```
/admin/wiki/
├── index.tsx           # Article listing page
├── new.tsx            # Create new article
├── [id]/
│   ├── edit.tsx       # Edit article
│   ├── preview.tsx    # Preview article
│   └── export.tsx     # Export options
├── categories/
│   ├── index.tsx      # Category management
│   └── new.tsx        # Create category
└── settings.tsx       # Wiki configuration
```

### 4.2 Key Components

#### WikiArticleList Component
- Server-side pagination with TanStack Table
- Real-time search with debouncing
- Multi-column sorting
- Bulk actions (publish, archive, delete)
- Status badges and quick actions

#### WikiEditor Component
- BlockNote.js integration
- Image upload with drag-and-drop
- Auto-save functionality
- Live preview mode
- Custom slash commands for medical content

#### ArticleMetadata Component
- Title and slug management
- Category selection dropdown
- Tag management with autocomplete
- Meta description editor
- Featured image upload

#### FileManager Component
- File upload with validation
- Image preview and basic editing
- File organization by article
- Storage quota tracking

### 4.3 State Management

Using TanStack Query for:
- Article CRUD operations
- File upload management
- Category management
- Real-time data synchronization

## Phase 5: BlockNote.js Integration

### 5.1 Custom Configuration

```typescript
// Custom BlockNote schema for medical content
const wikiSchema = BlockNoteSchema.create({
  blockSpecs: {
    // Default blocks
    ...defaultBlockSpecs,
    // Custom medical waste blocks
    wasteClassification: WasteClassificationBlock,
    procedureStep: ProcedureStepBlock,
    safetyAlert: SafetyAlertBlock,
  }
});

// Custom slash commands
const customSlashMenuItems = [
  {
    name: "Waste Classification",
    execute: (editor) => {
      editor.insertBlocks([{
        type: "wasteClassification",
        props: { wasteType: "biological" }
      }], editor.getTextCursorPosition().block, "after");
    }
  },
  // More medical-specific commands...
];
```

### 5.2 File Upload Integration

```typescript
// BlockNote file upload handler
const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await edenClient.api.wiki.files.upload.post(formData);
  if (response.data?.success) {
    return response.data.data.url;
  }
  throw new Error('Upload failed');
};
```

## Phase 6: PDF Export Implementation

### 6.1 Export Service

```typescript
// Using Puppeteer for high-quality PDF generation
export class ExportService {
  async generatePDF(articleId: number, options: PDFExportOptions): Promise<Buffer> {
    const article = await this.getArticleForExport(articleId);
    const html = await this.renderArticleHTML(article, options);
    
    return await this.generatePDFFromHTML(html, options);
  }
  
  private async renderArticleHTML(article: WikiArticle, options: PDFExportOptions): Promise<string> {
    // Convert BlockNote content to HTML
    // Apply styling and branding
    // Include/exclude images based on options
  }
}
```

## Phase 7: Security & Validation

### 7.1 File Upload Security
- MIME type validation
- File size limits (5MB)
- Virus scanning preparation
- Path traversal prevention
- Content sanitization

### 7.2 Content Security
- BlockNote content sanitization
- XSS prevention in rendered content
- Input validation for all text fields
- CSRF protection

### 7.3 Access Control
- Role-based access (admin/super-admin)
- Resource ownership validation
- Audit logging for all operations

## Phase 8: Performance & Optimization

### 8.1 Database Optimization
- Strategic indexing for common queries
- Full-text search capabilities
- Pagination optimization
- Query result caching

### 8.2 Frontend Optimization
- Code splitting for editor components
- Image lazy loading
- Progressive loading of article content
- Optimistic updates for better UX

### 8.3 File Storage Optimization
- Image compression and optimization
- CDN preparation
- Cleanup jobs for orphaned files

## Implementation Timeline

### Week 1: Foundation
- [ ] Enhance error handling and auth macro
- [ ] Implement database schema and migrations
- [ ] Create basic API structure and validation schemas
- [ ] Set up file upload functionality

### Week 2: Core Features
- [ ] Implement article CRUD operations
- [ ] Integrate BlockNote.js editor
- [ ] Create article listing and management UI
- [ ] Implement category management

### Week 3: Advanced Features
- [ ] Add file management interface
- [ ] Implement PDF export functionality
- [ ] Create article preview and publishing workflow
- [ ] Add bulk operations and advanced search

### Week 4: Polish & Testing
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation and user guides

## Success Criteria

1. **Functional Requirements Met**: All RF025-RF037 features implemented
2. **Performance**: Page load times < 2 seconds, file uploads < 30 seconds
3. **Security**: No critical vulnerabilities, proper RBAC enforcement
4. **Usability**: Intuitive interface for non-technical users
5. **Maintainability**: Clean, documented, and testable code

This implementation plan provides a comprehensive roadmap for building a professional-grade Wiki admin panel that meets all specified requirements while maintaining high standards for security, performance, and user experience.