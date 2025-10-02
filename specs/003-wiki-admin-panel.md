# Feature 003: Wiki Admin Panel Implementation

## Overview
Implementation of a comprehensive Wiki administration panel for creating, editing, and managing educational content about medical waste disposal. Utilizes BlockNote.js WYSIWYG editor for rich content creation with local file storage and future S3 extensibility.

## Technical Stack Integration
- **Frontend**: React + TanStack Router + ShadCN UI components
- **Backend**: Bun + Elysia + Drizzle ORM + PostgreSQL  
- **Editor**: BlockNote.js WYSIWYG editor
- **File Storage**: Local filesystem (extensible to S3)
- **Authentication**: Better Auth with RBAC
- **PDF Export**: jsPDF/Puppeteer integration

## Database Schema Extensions

### File Storage Schema
```sql
-- New table for managing uploaded files
CREATE TABLE wiki_files (
  id SERIAL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  associated_article_id INTEGER REFERENCES wiki_articles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_wiki_files_article ON wiki_files(associated_article_id);
CREATE INDEX idx_wiki_files_uploaded_by ON wiki_files(uploaded_by);
CREATE INDEX idx_wiki_files_created_at ON wiki_files(created_at);
```

### Enhanced Article Content Structure
```typescript
// BlockNote content structure stored in JSONB
interface WikiArticleContent {
  type: "doc";
  content: Block[];
}

interface Block {
  id: string;
  type: "paragraph" | "heading" | "bulletListItem" | "numberedListItem" | "image" | "table";
  props: {
    textColor?: string;
    backgroundColor?: string;
    textAlignment?: "left" | "center" | "right" | "justify";
    level?: 1 | 2 | 3; // for headings
  };
  content?: InlineContent[];
  children?: Block[];
}
```

## API Endpoints Specification

### Article Management Endpoints

#### GET /api/wiki/articles
**Purpose**: List all wiki articles with filtering and pagination  
**Access**: Admin, Super Admin  
**Query Parameters**:
- `page?: number` (default: 1)
- `limit?: number` (default: 10, max: 50)
- `status?: "draft" | "published" | "archived"`
- `category?: number` (category ID)
- `author?: string` (author ID)
- `search?: string` (title/content search)
- `sort?: "title" | "created_at" | "updated_at" | "published_at" | "view_count"`
- `order?: "asc" | "desc"` (default: "desc")

**Response Format**:
```typescript
{
  success: true;
  data: {
    articles: WikiArticle[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: {
      categories: { id: number; name: string; }[];
      authors: { id: string; name: string; }[];
      statuses: string[];
    };
  };
}
```

#### POST /api/wiki/articles
**Purpose**: Create new wiki article  
**Access**: Admin, Super Admin  
**Request Body**:
```typescript
{
  title: string; // 5-200 chars
  slug?: string; // auto-generated if not provided
  content: WikiArticleContent;
  excerpt?: string; // max 500 chars
  categoryId?: number;
  tagIds?: number[];
  status: "draft" | "published";
  featuredImageUrl?: string;
  metaDescription?: string; // max 160 chars
}
```

#### GET /api/wiki/articles/:id
**Purpose**: Get single article with full content  
**Access**: Admin, Super Admin  

#### PUT /api/wiki/articles/:id
**Purpose**: Update existing article  
**Access**: Admin, Super Admin (+ ownership check for Admin)  

#### DELETE /api/wiki/articles/:id
**Purpose**: Soft delete article (set status to archived)  
**Access**: Admin, Super Admin (+ ownership check for Admin)  

#### POST /api/wiki/articles/:id/publish
**Purpose**: Change article status to published  
**Access**: Admin, Super Admin  

#### POST /api/wiki/articles/:id/duplicate
**Purpose**: Create copy of existing article  
**Access**: Admin, Super Admin  

### File Management Endpoints

#### POST /api/wiki/files/upload
**Purpose**: Upload image/document for article  
**Access**: Admin, Super Admin  
**Content-Type**: multipart/form-data  
**Fields**:
- `file: File` (max 5MB, types: jpg, png, gif, pdf, doc, docx)
- `articleId?: number` (associate with specific article)

**Response**:
```typescript
{
  success: true;
  data: {
    id: number;
    originalName: string;
    url: string; // local URL path
    mimeType: string;
    fileSize: number;
  };
}
```

#### GET /api/wiki/files/:id
**Purpose**: Serve uploaded file  
**Access**: Public (files are referenced in published articles)  

#### DELETE /api/wiki/files/:id
**Purpose**: Delete uploaded file  
**Access**: Admin, Super Admin (+ ownership check)  

### Export Endpoints

#### GET /api/wiki/articles/:id/export/pdf
**Purpose**: Generate PDF version of article  
**Access**: Admin, Super Admin  
**Query Parameters**:
- `includeImages?: boolean` (default: true)
- `format?: "A4" | "Letter"` (default: "A4")

**Response**: PDF file download

## Frontend Component Architecture

### Route Structure
```
/admin/wiki/
├── index              # Article listing page
├── new               # Create new article
├── [id]/
│   ├── edit          # Edit existing article
│   ├── preview       # Preview article as student would see
│   └── export        # Export options
└── settings          # Wiki configuration
```

### Key Components

#### 1. WikiArticleList Component
**File**: `apps/web/src/features/wiki/components/WikiArticleList.tsx`
**Purpose**: Main listing with search, filters, and actions
**Features**:
- Server-side pagination
- Real-time search with debouncing
- Multi-column sorting
- Bulk actions (publish, archive, delete)
- Status badges and quick actions
- Responsive data table

#### 2. WikiEditor Component  
**File**: `apps/web/src/features/wiki/components/WikiEditor.tsx`
**Purpose**: BlockNote.js integration for content editing
**Features**:
- Rich text editing with BlockNote
- Image upload integration
- Auto-save functionality
- Live preview mode
- Collaborative editing indicators
- Custom slash commands for medical waste content

#### 3. ArticleMetadata Component
**File**: `apps/web/src/features/wiki/components/ArticleMetadata.tsx`
**Purpose**: SEO and categorization settings
**Features**:
- Title and slug management
- Category selection
- Tag management with autocomplete
- Meta description editor
- Featured image upload
- Reading time estimation

#### 4. FileManager Component
**File**: `apps/web/src/features/wiki/components/FileManager.tsx`
**Purpose**: File upload and management
**Features**:
- Drag-and-drop file upload
- File type validation
- Image preview and cropping
- File organization by article
- Storage quota management

## Backend Implementation Details

### Service Layer Architecture

#### WikiArticleService
**File**: `apps/server/src/modules/wiki/services/articles.service.ts`
**Responsibilities**:
- CRUD operations for articles
- Content processing and sanitization
- Reading time calculation
- Search indexing (plain text extraction)
- Relationship management

#### FileStorageService
**File**: `apps/server/src/modules/wiki/services/file-storage.service.ts`
**Responsibilities**:
- File upload handling
- File type validation and security scanning
- Image processing and optimization
- Local storage management
- S3 migration preparation (interface design)

#### ExportService
**File**: `apps/server/src/modules/wiki/services/export.service.ts`
**Responsibilities**:
- PDF generation from BlockNote content
- Template management for exports
- Watermarking and branding
- Batch export operations

### Validation Schemas

```typescript
// Article creation validation
export const createArticleSchema = {
  body: t.Object({
    title: t.String({ minLength: 5, maxLength: 200 }),
    slug: t.Optional(t.String({ pattern: "^[a-z0-9-]+$" })),
    content: t.Object({}), // BlockNote content structure
    excerpt: t.Optional(t.String({ maxLength: 500 })),
    categoryId: t.Optional(t.Number()),
    tagIds: t.Optional(t.Array(t.Number())),
    status: t.Union([t.Literal("draft"), t.Literal("published")]),
    featuredImageUrl: t.Optional(t.String()),
    metaDescription: t.Optional(t.String({ maxLength: 160 })),
  })
};

// File upload validation
export const fileUploadSchema = {
  body: t.Object({
    articleId: t.Optional(t.Number()),
  }),
  files: t.Object({
    file: t.File({
      maxSize: 5 * 1024 * 1024, // 5MB
      type: ["image/jpeg", "image/png", "image/gif", "application/pdf", 
             "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    })
  })
};
```

### Error Handling Enhancements

```typescript
// Wiki-specific errors
export class ArticleNotFoundError extends NotFoundError {
  constructor(articleId: number) {
    super(`Article with ID ${articleId}`);
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

export class ContentProcessingError extends InternalServerError {
  constructor(details: string) {
    super(`Content processing failed: ${details}`);
    this.code = "CONTENT_PROCESSING_ERROR";
  }
}
```

## Frontend State Management

### TanStack Query Integration

```typescript
// Article queries
export const useArticles = (params: ArticleListParams) => {
  return useQuery({
    queryKey: ['wiki', 'articles', params],
    queryFn: () => wikiApi.getArticles(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useArticle = (id: number) => {
  return useQuery({
    queryKey: ['wiki', 'article', id],
    queryFn: () => wikiApi.getArticle(id),
    enabled: !!id,
  });
};

// Article mutations
export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wikiApi.createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki', 'articles'] });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateArticleData }) => 
      wikiApi.updateArticle(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['wiki', 'article', id] });
      queryClient.invalidateQueries({ queryKey: ['wiki', 'articles'] });
    },
  });
};
```

### Form State Management

```typescript
// Article form with react-hook-form
export const useArticleForm = (article?: WikiArticle) => {
  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: article ? {
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || "",
      categoryId: article.categoryId || undefined,
      tagIds: article.articleTags?.map(at => at.tagId) || [],
      status: article.status,
      featuredImageUrl: article.featuredImageUrl || "",
      metaDescription: article.metaDescription || "",
    } : {
      title: "",
      slug: "",
      content: { type: "doc", content: [] },
      excerpt: "",
      status: "draft",
      tagIds: [],
    },
  });

  return form;
};
```

## Security Considerations

### Content Security
- **XSS Prevention**: BlockNote content sanitization
- **File Upload Security**: MIME type validation, virus scanning placeholder
- **Access Control**: RBAC enforcement on all endpoints
- **Input Validation**: Comprehensive validation schemas

### File Security
- **File Type Restriction**: Whitelist of allowed MIME types
- **File Size Limits**: 5MB per file, with quota tracking
- **Path Traversal Prevention**: UUID-based filenames
- **Storage Isolation**: Files stored outside web root

### API Security
- **Rate Limiting**: Upload and export operations
- **CSRF Protection**: SameSite cookies and CSRF tokens
- **Authentication**: Required for all admin operations
- **Audit Logging**: All operations logged for compliance

## Performance Optimizations

### Database Optimizations
- **Strategic Indexing**: Multi-column indexes for common queries
- **Content Caching**: Redis caching for published articles
- **Search Optimization**: Full-text search on extracted plain text
- **Pagination**: Cursor-based pagination for large datasets

### Frontend Optimizations
- **Code Splitting**: Lazy loading of editor components
- **Image Optimization**: Automatic image compression and WebP conversion
- **Bundle Optimization**: Tree-shaking and chunk optimization
- **Caching Strategy**: Service worker for offline content access

### File Storage Optimizations
- **Image Processing**: Automatic resizing and format optimization
- **CDN Ready**: URL structure compatible with CDN integration
- **Lazy Loading**: Progressive image loading in editor
- **Cleanup Jobs**: Automated orphaned file cleanup

## Testing Strategy

### Backend Testing
- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: Database operations and API endpoints
- **Security Tests**: Authentication, authorization, and input validation
- **Performance Tests**: Load testing for file uploads and exports

### Frontend Testing
- **Component Tests**: Individual component behavior
- **Integration Tests**: Form submission and data flow
- **E2E Tests**: Complete user workflows
- **Accessibility Tests**: WCAG compliance verification

## Migration Plan

### Phase 1: Backend Foundation (Week 1)
1. Implement file storage schema and migrations
2. Create file upload service and endpoints
3. Enhance article service with content processing
4. Implement export service for PDF generation

### Phase 2: Frontend Core (Week 2)
1. Create article listing page with search/filters
2. Implement BlockNote editor integration
3. Build file upload and management components
4. Create article metadata forms

### Phase 3: Advanced Features (Week 3)
1. Add article relationships and linking
2. Implement batch operations
3. Create export functionality
4. Add collaborative editing features

### Phase 4: Polish & Testing (Week 4)
1. Comprehensive testing suite
2. Performance optimizations
3. Security audit and fixes
4. Documentation and user guides

## Future Enhancements

### Immediate Roadmap
- **S3 Integration**: Migrate from local to cloud storage
- **Advanced Search**: Elasticsearch integration
- **Version History**: Article version tracking and diff viewing
- **Workflow Management**: Approval processes for publishing

### Long-term Vision
- **AI Integration**: Content suggestions and auto-categorization
- **Multi-language Support**: Internationalization for global use
- **Analytics Dashboard**: Content performance and engagement metrics
- **API Documentation**: Auto-generated API docs for third-party integrations

---

## Implementation Priority

**High Priority (MVP)**:
- Article CRUD operations
- BlockNote editor integration
- File upload functionality
- Basic PDF export

**Medium Priority**:
- Advanced search and filtering
- Bulk operations
- Article relationships
- Performance optimizations

**Low Priority**:
- Collaborative editing
- Advanced export options
- Analytics integration
- Third-party integrations

This specification provides a comprehensive roadmap for implementing a professional-grade Wiki admin panel that meets all stated requirements while maintaining high standards for security, performance, and user experience.