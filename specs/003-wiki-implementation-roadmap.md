# Wiki Admin Panel - Implementation Roadmap

## Current Status Analysis ✅

### Already Implemented
- ✅ Better Auth with RBAC (admin, super-admin roles)
- ✅ PostgreSQL + Drizzle ORM
- ✅ Elysia backend with proper error handling (JSON responses)
- ✅ BlockNote.js installed (@blocknote/core, @blocknote/react, @blocknote/shadcn, @blocknote/xl-pdf-exporter)
- ✅ Basic wiki module structure (`/modules/wiki`)
- ✅ Global error handler returning JSON responses
- ✅ TanStack Router and ShadCN UI in frontend

### Requirements from INSTRUCTIONS.md

Based on Section 3.5 (RF025-RF029) - Gestão de Wiki Administrativo:

#### RF025 - Listagem de Artigos Wiki
- Filter by category, status (draft/published), author, date
- Search by title and content
- Pagination with configurable items per page
- Bulk operations (publish, archive, delete)

#### RF026 - Criar Artigo Wiki  
- Rich text editor with BlockNote.js
- File upload integration (images, documents)
- SEO metadata (title, description, featured image)
- Category and tag assignment
- Draft/Published status management

#### RF027 - Editar Artigo Wiki
- Version history tracking
- Real-time auto-save
- Preview functionality
- Content validation and sanitization

#### RF028 - Gestão de Arquivos Wiki
- Image upload with optimization
- Document upload (PDF, DOC, DOCX)
- File organization by article
- CDN-ready URLs for S3 migration

#### RF029 - Exportar Conteúdo Wiki
- Individual article PDF export
- Bulk export functionality
- Template customization
- Include/exclude images option

## Implementation Plan

### Phase 1: Enhanced Database Schema & Services (Week 1)

#### 1.1 Database Schema Extensions
```sql
-- Enhanced wiki_articles table
ALTER TABLE wiki_articles ADD COLUMN IF NOT EXISTS:
  - content JSONB (BlockNote format)
  - excerpt TEXT
  - featured_image_url TEXT
  - meta_description TEXT
  - reading_time_minutes INTEGER
  - view_count INTEGER DEFAULT 0
  - search_vector TSVECTOR

-- New wiki_files table  
CREATE TABLE wiki_files (
  id SERIAL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  upload_url TEXT, -- For S3 URLs
  thumbnail_url TEXT, -- For image thumbnails
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  associated_article_id INTEGER REFERENCES wiki_articles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article version history
CREATE TABLE wiki_article_versions (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  title VARCHAR(200) NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, version_number)
);

-- File usage tracking (which files are used in which articles)
CREATE TABLE wiki_article_files (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
  file_id INTEGER NOT NULL REFERENCES wiki_files(id) ON DELETE CASCADE,
  usage_context TEXT, -- 'content', 'featured_image', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, file_id, usage_context)
);
```

#### 1.2 File Storage Service
```typescript
// apps/server/src/modules/wiki/services/file-storage.service.ts
class FileStorageService {
  // Local storage implementation
  async uploadFile(file: File, options: UploadOptions): Promise<UploadResult>
  async deleteFile(fileId: number): Promise<void>
  async generateThumbnail(filePath: string): Promise<string>
  
  // S3-ready interface for future migration
  async migrateToS3(fileId: number): Promise<void>
  getFileUrl(file: WikiFile): string
}
```

#### 1.3 Article Service Enhancements
```typescript
// Enhanced ArticleService with BlockNote content handling
class ArticleService {
  async createArticle(data: CreateArticleData, authorId: string): Promise<WikiArticle>
  async updateArticle(id: number, data: UpdateArticleData, authorId: string): Promise<WikiArticle>
  async createVersion(articleId: number, content: BlockNoteContent): Promise<ArticleVersion>
  async processBlockNoteContent(content: BlockNoteContent): Promise<ProcessedContent>
  async extractPlainText(content: BlockNoteContent): string // For search indexing
  async calculateReadingTime(content: BlockNoteContent): number
}
```

### Phase 2: API Endpoints Enhancement (Week 1-2)

#### 2.1 Enhanced Article Endpoints
```typescript
// GET /api/wiki/articles - Enhanced with full-text search
// POST /api/wiki/articles - With BlockNote content processing  
// PUT /api/wiki/articles/:id - With version management
// GET /api/wiki/articles/:id/versions - Version history
// POST /api/wiki/articles/:id/restore/:version - Restore version
```

#### 2.2 File Management Endpoints
```typescript
// POST /api/wiki/files/upload - Multi-file upload with progress
// GET /api/wiki/files/:id - Serve files with caching headers
// DELETE /api/wiki/files/:id - Safe deletion with usage check
// POST /api/wiki/files/:id/optimize - Image optimization
// GET /api/wiki/files/usage/:fileId - Show file usage across articles
```

#### 2.3 Export Endpoints
```typescript
// GET /api/wiki/articles/:id/export/pdf - Individual PDF export
// POST /api/wiki/export/bulk-pdf - Multiple articles to single PDF
// GET /api/wiki/export/all - Full wiki export
```

### Phase 3: Frontend Implementation (Week 2-3)

#### 3.1 Route Structure
```
/admin/wiki/
├── index                 # Article listing with search/filters
├── new                  # Create new article with BlockNote editor
├── [id]/
│   ├── edit            # Edit with BlockNote + file management
│   ├── preview         # Live preview
│   ├── versions        # Version history
│   └── export          # Export options
├── files/              # File management interface
│   ├── index          # File browser/manager
│   └── upload         # Bulk upload interface
└── settings/           # Wiki configuration
    ├── categories     # Category management
    ├── templates      # Export templates
    └── storage        # Storage usage & settings
```

#### 3.2 Key Components

##### WikiArticleList
```typescript
// apps/web/src/features/wiki/components/WikiArticleList.tsx
- Server-side search with full-text capabilities
- Advanced filtering (category, author, date range, status)
- Bulk operations (publish, archive, export)
- Real-time status updates
- Performance-optimized virtual scrolling for large lists
```

##### BlockNoteEditor Integration
```typescript
// apps/web/src/features/wiki/components/WikiEditor.tsx
- Custom BlockNote editor with ShadCN styling
- Image upload integration with drag-drop
- Auto-save with conflict resolution
- Custom slash commands for medical waste content
- Live collaboration indicators (future)
- Word count and reading time estimation
```

##### FileManager Component
```typescript
// apps/web/src/features/wiki/components/FileManager.tsx
- Drag-and-drop multi-file upload
- Image preview with cropping tools
- File organization and search
- Usage tracking across articles
- Storage quota visualization
- Bulk operations (delete, move, optimize)
```

##### ExportManager
```typescript
// apps/web/src/features/wiki/components/ExportManager.tsx
- PDF template selection
- Bulk export with custom covers
- Export progress tracking
- Download management
- Print-optimized layouts
```

### Phase 4: Advanced Features (Week 3-4)

#### 4.1 Search Enhancement
```typescript
// Full-text search with PostgreSQL's built-in capabilities
- Weighted search (title > content > tags)
- Search suggestions and autocomplete
- Advanced search filters
- Search analytics and popular queries
```

#### 4.2 Content Management Features
```typescript
// Advanced content features
- Content templates for consistent formatting
- Automated content validation
- SEO analysis and suggestions
- Content scheduling for publication
- Related articles suggestions
```

#### 4.3 File Management Advanced
```typescript
// Advanced file features
- Automatic image optimization (WebP conversion)
- CDN URL generation for S3 migration
- File versioning for images
- Bulk file operations
- Storage analytics and cleanup tools
```

## Technical Implementation Details

### Error Handling Enhancement
The current error handling already returns JSON responses correctly. I'll extend it for wiki-specific errors:

```typescript
// Wiki-specific error classes
export class ArticleNotFoundError extends NotFoundError {
  constructor(articleId: number) {
    super(`Article with ID ${articleId}`);
    this.code = "ARTICLE_NOT_FOUND";
  }
}

export class FileUploadError extends BadRequestError {
  constructor(reason: string) {
    super(`File upload failed: ${reason}`);
    this.code = "FILE_UPLOAD_ERROR";
  }
}

export class ContentProcessingError extends InternalServerError {
  constructor(details: string) {
    super(`Content processing failed: ${details}`);
    this.code = "CONTENT_PROCESSING_ERROR";
  }
}
```

### Eden Treaty Integration
For type-safe API calls from frontend:

```typescript
// apps/web/src/lib/api/wiki.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '@medwaster/server'

const api = treaty<App>('http://localhost:3000')

export const wikiApi = {
  articles: api.wiki.articles,
  files: api.wiki.files,
  export: api.wiki.export
}
```

### State Management with TanStack Query
```typescript
// Optimistic updates and caching
export const useArticles = (params: ArticleListParams) => {
  return useQuery({
    queryKey: ['wiki', 'articles', params],
    queryFn: () => wikiApi.articles.get({ query: params }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wikiApi.articles.post,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki', 'articles'] });
    },
  });
};
```

## Security Considerations

1. **File Upload Security**
   - MIME type validation with magic number checking
   - File size limits (5MB default, configurable)
   - Virus scanning integration points
   - Secure file storage outside web root

2. **Content Security**
   - BlockNote content sanitization
   - XSS prevention in rich text content
   - CSRF protection for file uploads
   - Input validation for all metadata

3. **Access Control**
   - Article-level permissions (admin can edit own, super-admin can edit all)
   - File access control based on article permissions
   - Audit logging for all administrative actions

## Performance Optimizations

1. **Database**
   - Full-text search indexes on article content
   - Proper indexing for filtering and sorting
   - Content caching for published articles

2. **File Storage**
   - Image optimization and WebP conversion
   - CDN-ready architecture for S3 migration
   - Lazy loading for file previews

3. **Frontend**
   - Virtual scrolling for large article lists
   - Code splitting for editor components
   - Optimistic updates for better UX

## Success Metrics

1. **Functionality**: All RF025-RF029 requirements implemented
2. **Performance**: Article list loads in <2s, editor responsive
3. **User Experience**: Intuitive BlockNote editor integration
4. **Reliability**: Comprehensive error handling and validation
5. **Maintainability**: Clean service architecture with clear separation
6. **Extensibility**: S3-ready file storage, plugin architecture for exports

## Next Steps

1. Start with Phase 1 database schema and services
2. Implement core CRUD operations with BlockNote integration
3. Build file upload and management system
4. Create frontend components with BlockNote editor
5. Add advanced features and optimizations

This roadmap provides a comprehensive path to implement a professional Wiki admin panel that meets all requirements while maintaining high code quality and user experience.