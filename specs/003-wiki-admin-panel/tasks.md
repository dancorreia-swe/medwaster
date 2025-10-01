# Tasks: Wiki Admin Panel Implementation

# Tasks: Wiki Admin Panel Implementation

**Branch**: `003-wiki-admin-panel` | **Date**: 2025-01-26  
**Spec**: `/specs/003-wiki-admin-panel/spec.md` | **Updated**: 2025-01-26

## Task Organization Strategy

### Current System Analysis ✅
- **Error Handling**: Global error handler already implemented with JSON responses and proper HTTP status codes
- **Auth System**: Better Auth with RBAC - `ADMIN` and `SUPER_ADMIN` roles working
- **Auth Guards**: `betterAuthMacro.auth()` and `betterAuthMacro.role(['admin', 'super-admin'])` available
- **Database**: PostgreSQL with Drizzle ORM patterns established
- **Frontend**: React + TanStack Router + ShadCN UI components ready

### Implementation Phases
1. **Phase 1 (P0)**: Database schema and core API operations
2. **Phase 2 (P1)**: Admin interface and BlockNote editor integration
3. **Phase 3 (P2)**: Enhanced features and PDF export functionality
4. **Phase 4 (P3)**: Advanced functionality and optimization

### Dependencies
- Database schema must complete before API implementation
- Core API endpoints required before frontend integration
- Basic editor functionality needed before advanced features

---

## Phase 1: Foundation (P0 - Critical)

### T001: Database Schema Implementation
**Priority**: P0  
**Estimate**: 60 minutes  
**Dependencies**: None

**Description**: Create dedicated wiki database schema following existing Drizzle patterns

**Acceptance Criteria**:
- [ ] Create `apps/server/src/db/schema/wiki.ts` following existing patterns
- [ ] Implement `wikiCategories` table with hierarchical support (max 3 levels)
- [ ] Implement `wikiTags` table with usage tracking and hierarchy (max 2 levels)
- [ ] Implement `wikiArticles` table with JSONB content storage for BlockNote
- [ ] Implement `wikiUploads` table for local file storage (S3-extensible)
- [ ] Implement `wikiArticleTags` junction table for many-to-many relationships
- [ ] Add proper TypeScript types and Drizzle relations
- [ ] Create database migration using `bun run db:generate`
- [ ] Add indexes for performance (title, slug, status, category_id, content_text)

**Files to Create**:
```
apps/server/src/db/schema/wiki.ts
apps/server/src/db/migrations/[timestamp]_create_wiki_schema.sql
```

**Technical Notes**:
- Use existing Drizzle patterns from `apps/server/src/db/schema/auth.ts`
- JSONB for BlockNote content, TEXT for searchable content extraction
- Foreign keys with proper cascade options
- Status fields using VARCHAR with enum-like constraints

---

### T002: Wiki Module Backend API
**Priority**: P0  
**Estimate**: 120 minutes  
**Dependencies**: T001

**Description**: Implement complete backend API following existing module patterns

**Acceptance Criteria**:
- [ ] Create `apps/server/src/modules/wiki-articles/` module structure
- [ ] Implement WikiArticleService with static methods (following existing patterns)
- [ ] Create Elysia routes with proper auth guards (`role(['admin', 'super-admin'])`)
- [ ] Add CRUD endpoints: GET, POST, PUT, DELETE with proper validation
- [ ] Implement publication workflow: draft → published → archived
- [ ] Add bulk operations endpoint for status changes
- [ ] Add search endpoint with content text filtering
- [ ] Use existing global error handler (throw HttpError classes)
- [ ] Create WikiCategoryService and WikiTagService
- [ ] Add file upload endpoint for images

**Endpoints to Create**:
```
GET    /api/wiki/articles              - List with filters/search
POST   /api/wiki/articles              - Create new article
GET    /api/wiki/articles/:id          - Get single article
PUT    /api/wiki/articles/:id          - Update article
DELETE /api/wiki/articles/:id          - Delete article
PATCH  /api/wiki/articles/:id/publish  - Publish workflow
POST   /api/wiki/uploads               - File upload
GET    /api/wiki/categories            - List categories
POST   /api/wiki/categories            - Create category
GET    /api/wiki/tags                  - List tags with search
POST   /api/wiki/tags                  - Create tag
```

**Files to Create**:
```
apps/server/src/modules/wiki-articles/
├── index.ts              - Elysia routes
├── model.ts              - Types and validation schemas
└── service.ts            - Business logic (static methods)

apps/server/src/modules/wiki-categories/
├── index.ts
├── model.ts
└── service.ts

apps/server/src/modules/wiki-tags/
├── index.ts
├── model.ts
└── service.ts

apps/server/src/modules/wiki-uploads/
├── index.ts
├── model.ts
└── service.ts
```

**Technical Notes**:
- Follow existing patterns from `apps/server/src/modules/wiki/` and `apps/server/src/modules/questions/`
- Use existing auth macro: `betterAuthMacro.auth()` and `betterAuthMacro.role()`
- Use existing error classes: `NotFoundError`, `ValidationError`, `UnauthorizedError`, etc.
- All errors handled by global error handler (JSON responses automatic)

---

### T003: File Upload and Storage
**Priority**: P0  
**Estimate**: 75 minutes  
**Dependencies**: T002

**Description**: Implement local file storage with S3-extensible architecture

**Acceptance Criteria**:
- [ ] Create FileStorageService with local storage implementation
- [ ] Support image uploads (jpg, png, gif, webp) with size validation (5MB max)
- [ ] Organized storage structure: `/uploads/wiki/YYYY/MM/uuid.ext`
- [ ] Image processing (resize, optimize) for web display
- [ ] Secure file serving with proper content-type headers
- [ ] S3-ready interface for future migration
- [ ] File cleanup on article deletion
- [ ] Support for featured images and inline images

**Files to Create**:
```
apps/server/src/lib/file-storage.ts
apps/server/src/lib/image-processor.ts
```

**Technical Notes**:
- Use existing file system patterns
- Abstract interface for future S3 migration
- Image processing with Sharp or similar
- Proper MIME type validation and security checks

---

### T004: PDF Export Service
**Priority**: P0  
**Estimate**: 90 minutes  
**Dependencies**: T002

**Description**: Implement PDF generation service for wiki articles

**Acceptance Criteria**:
- [ ] Create PDFService for BlockNote content to PDF conversion
- [ ] Support all BlockNote content types (text, images, tables, lists)
- [ ] Add branded header/footer with organization information
- [ ] Include article metadata (title, author, date, reading time)
- [ ] Optimize performance (target: <5 seconds per article)
- [ ] Handle images and embedded media properly
- [ ] Support bulk PDF generation for multiple articles
- [ ] Add proper error handling with existing error classes

**Files to Create**:
```
apps/server/src/lib/pdf-generator.ts
apps/server/src/lib/pdf-templates.ts
```

**Endpoint to Add**:
```
GET /api/wiki/articles/:id/export-pdf
POST /api/wiki/articles/bulk-export-pdf
```

**Technical Notes**:
- Use Puppeteer or similar for HTML-to-PDF conversion
- Design reusable templates for consistent formatting
- Consider caching for frequently exported articles
- Proper memory management for bulk operations

---

### T005: Integration and Testing
**Priority**: P0  
**Estimate**: 45 minutes  
**Dependencies**: T001-T004

**Description**: Integrate modules with main app and add basic testing

**Acceptance Criteria**:
- [ ] Add wiki modules to main server app (`apps/server/src/index.ts`)
- [ ] Verify all endpoints accessible and returning proper JSON responses
- [ ] Test auth guards with admin and super-admin roles
- [ ] Test error responses using global error handler
- [ ] Verify file upload and storage functionality
- [ ] Test PDF generation with sample content
- [ ] Create basic API tests for critical endpoints

**Files to Modify**:
```
apps/server/src/index.ts (add .use(wikiModules))
```

**Files to Create**:
```
apps/server/src/modules/wiki-articles/__tests__/api.test.ts
apps/server/src/modules/wiki-uploads/__tests__/upload.test.ts
```

**Technical Notes**:
- Use existing testing patterns with Bun test
- Focus on integration testing rather than unit tests initially
- Verify auth macro behavior with different roles

---

## Phase 2: Admin Interface (P1 - High)

### T006: Admin Route Structure
**Priority**: P1  
**Estimate**: 30 minutes  
**Dependencies**: T005

**Description**: Set up TanStack Router structure for wiki admin

**Acceptance Criteria**:
- [ ] Create route structure under `/_auth/admin/wiki/`
- [ ] Implement route guards using existing auth patterns
- [ ] Add navigation integration with existing admin layout
- [ ] Create loading states and error boundaries

**Files to Create**:
```
apps/web/src/routes/_auth/admin/wiki/
├── index.tsx                    - Wiki dashboard
├── articles/
│   ├── index.tsx               - Articles listing
│   ├── new.tsx                 - Create article
│   └── $articleId/
│       └── edit.tsx            - Edit article
├── categories/
│   └── index.tsx               - Category management
└── tags/
    └── index.tsx               - Tag management
```

**Technical Notes**:
- Follow existing admin route patterns
- Use existing layout components
- Both admin and super-admin access (no additional restrictions)

---

### T007: Article Listing Interface
**Priority**: P1  
**Estimate**: 90 minutes  
**Dependencies**: T006

**Description**: Create comprehensive article management interface

**Acceptance Criteria**:
- [ ] DataTable component using ShadCN Table
- [ ] Search functionality with debouncing (300ms)
- [ ] Multi-criteria filtering (status, category, tags, date range)
- [ ] Bulk selection and operations interface
- [ ] Status badges and quick action buttons
- [ ] Pagination with server-side data fetching
- [ ] Loading states and error handling using existing patterns
- [ ] Export functionality (PDF, CSV)

**Files to Create**:
```
apps/web/src/features/wiki/components/
├── ArticlesList.tsx
├── ArticleFilters.tsx
├── ArticleSearch.tsx
├── BulkActions.tsx
└── ArticleTableColumns.tsx

apps/web/src/features/wiki/api/articles.ts
apps/web/src/features/wiki/hooks/useArticleList.ts
```

**Technical Notes**:
- Use TanStack Query for data fetching
- Follow existing component patterns from ShadCN
- Implement proper TypeScript types from backend API

---

### T008: BlockNote Editor Integration
**Priority**: P1  
**Estimate**: 120 minutes  
**Dependencies**: T006

**Description**: Integrate BlockNote.js editor with enhanced functionality

**Acceptance Criteria**:
- [ ] BlockNote editor component setup with existing configuration
- [ ] Custom blocks for medical content (procedures, warnings, highlights)
- [ ] Image upload integration with drag-and-drop
- [ ] Auto-save functionality (30-second intervals with debouncing)
- [ ] Word count and reading time calculation display
- [ ] Content validation and error feedback
- [ ] Preview mode showing student view
- [ ] Mobile-responsive design

**Files to Create**:
```
apps/web/src/features/wiki/components/
├── WikiEditor.tsx
├── CustomBlocks.tsx
├── ImageUpload.tsx
└── EditorToolbar.tsx

apps/web/src/features/wiki/hooks/
├── useWikiEditor.ts
├── useAutoSave.ts
└── useImageUpload.ts
```

**Dependencies to Install**:
```bash
bun add @blocknote/core @blocknote/react @blocknote/shadcn
```

**Technical Notes**:
- Extend existing BlockNote configuration
- Custom blocks for medical waste disposal procedures
- Integration with file upload service from backend

---

### T009: Article Form and Metadata
**Priority**: P1  
**Estimate**: 90 minutes  
**Dependencies**: T007, T008

**Description**: Complete article creation and editing interface

**Acceptance Criteria**:
- [ ] Article metadata form (title, slug, excerpt, SEO fields)
- [ ] Category selector with hierarchical display
- [ ] Tag input with auto-complete and creation
- [ ] Featured image upload and management
- [ ] Publication status controls (draft/published/archived)
- [ ] Form validation with comprehensive error messages
- [ ] Save/publish/preview actions
- [ ] Auto-save integration with conflict resolution

**Files to Create**:
```
apps/web/src/features/wiki/components/
├── ArticleForm.tsx
├── ArticleMetadata.tsx
├── CategorySelector.tsx
├── TagInput.tsx
├── PublicationStatus.tsx
└── FeaturedImage.tsx

apps/web/src/features/wiki/validation/article-schema.ts
```

**Technical Notes**:
- Use React Hook Form for complex form state
- Integration with existing validation patterns
- Proper TypeScript types from backend API responses

---

### T010: PDF Export Integration
**Priority**: P1  
**Estimate**: 45 minutes  
**Dependencies**: T009

**Description**: Frontend integration for PDF export functionality

**Acceptance Criteria**:
- [ ] PDF export button with loading states
- [ ] Progress indicator for PDF generation
- [ ] Error handling for failed exports
- [ ] Bulk PDF export for multiple articles
- [ ] Download functionality with proper file naming
- [ ] Export options (single article, selected articles, all published)

**Files to Create**:
```
apps/web/src/features/wiki/components/
├── PDFExport.tsx
└── BulkPDFExport.tsx

apps/web/src/features/wiki/utils/pdf-utils.ts
```

**Technical Notes**:
- Integration with backend PDF service
- Proper error handling using existing patterns
- User feedback during export process

---

## Phase 3: Enhanced Features (P2 - Medium)

### T011: Category Management Interface
**Priority**: P2  
**Estimate**: 75 minutes  
**Dependencies**: T010

**Description**: Admin interface for hierarchical category management

**Acceptance Criteria**:
- [ ] Hierarchical category tree view with expand/collapse
- [ ] Create, edit, delete category forms
- [ ] Color coding and visual organization
- [ ] Drag-and-drop reordering (future enhancement)
- [ ] Category usage statistics
- [ ] Bulk article reassignment between categories

**Files to Create**:
```
apps/web/src/features/wiki/components/
├── CategoryTree.tsx
├── CategoryForm.tsx
└── CategoryStats.tsx

apps/web/src/routes/_auth/admin/wiki/categories/index.tsx
```

---

### T012: Tag Management Interface
**Priority**: P2  
**Estimate**: 60 minutes  
**Dependencies**: T011

**Description**: Comprehensive tag management system

**Acceptance Criteria**:
- [ ] Tag list with search and filtering
- [ ] Create, edit, delete tag functionality
- [ ] Usage statistics and analytics
- [ ] Bulk operations (merge, delete, reassign)
- [ ] Tag hierarchy visualization (parent-child relationships)
- [ ] Auto-complete integration for tag input

**Files to Create**:
```
apps/web/src/features/wiki/components/
├── TagManager.tsx
├── TagForm.tsx
├── TagStats.tsx
└── TagHierarchy.tsx

apps/web/src/routes/_auth/admin/wiki/tags/index.tsx
```

---

### T013: Search and Advanced Filtering
**Priority**: P2  
**Estimate**: 60 minutes  
**Dependencies**: T010

**Description**: Enhanced search capabilities with full-text search

**Acceptance Criteria**:
- [ ] Full-text search across article content
- [ ] Advanced filter combinations (multiple categories, tags, etc.)
- [ ] Search result highlighting
- [ ] Saved search presets
- [ ] Search performance optimization
- [ ] Search analytics and popular queries

**Files to Create/Modify**:
```
apps/server/src/modules/wiki-articles/search-service.ts
apps/web/src/features/wiki/components/
├── AdvancedSearch.tsx
├── SearchResults.tsx
└── SavedSearches.tsx
```

**Technical Notes**:
- PostgreSQL full-text search implementation
- Search result ranking and relevance scoring
- Debounced search to avoid excessive API calls

---

### T014: Analytics Dashboard
**Priority**: P2  
**Estimate**: 90 minutes  
**Dependencies**: T012

**Description**: Content analytics and usage metrics dashboard

**Acceptance Criteria**:
- [ ] Article performance metrics (views, reading time, engagement)
- [ ] Category and tag usage analytics
- [ ] Author productivity metrics
- [ ] Popular content identification
- [ ] Visual charts and data visualization
- [ ] Export analytics data (CSV, PDF reports)

**Files to Create**:
```
apps/web/src/features/wiki/components/
├── AnalyticsDashboard.tsx
├── ContentMetrics.tsx
├── UsageCharts.tsx
└── PopularContent.tsx

apps/web/src/routes/_auth/admin/wiki/analytics/index.tsx
apps/server/src/modules/wiki-analytics/
├── index.ts
├── model.ts
└── service.ts
```

**Technical Notes**:
- Use charting library (Recharts recommended for React)
- Real-time data updates with proper caching
- Performance considerations for large datasets

---

## Phase 4: Advanced Features (P3 - Low)

### T015: Bulk Operations Enhancement
**Priority**: P3  
**Estimate**: 45 minutes  
**Dependencies**: T013

**Description**: Enhanced bulk operations for efficient content management

**Acceptance Criteria**:
- [ ] Multi-select interface for articles
- [ ] Bulk status changes (publish, unpublish, archive)
- [ ] Bulk category and tag assignment
- [ ] Progress indicators for long operations
- [ ] Rollback capabilities for failed operations
- [ ] Confirmation dialogs for destructive actions

**Files to Create**:
```
apps/web/src/features/wiki/components/
├── BulkOperations.tsx
├── BulkStatusChange.tsx
├── BulkTagAssignment.tsx
└── BulkCategoryAssignment.tsx
```

---

### T016: Content Relationships
**Priority**: P3  
**Estimate**: 60 minutes  
**Dependencies**: T014

**Description**: Article relationship management (related articles, prerequisites)

**Acceptance Criteria**:
- [ ] Link articles as related, prerequisites, or follow-ups
- [ ] Visual relationship management interface
- [ ] Automatic relationship suggestions based on content
- [ ] Relationship validation and integrity checks
- [ ] Display of related articles in student view

**Files to Create**:
```
apps/web/src/features/wiki/components/
├── ArticleRelationships.tsx
├── RelationshipForm.tsx
└── RelationshipVisualization.tsx

apps/server/src/modules/wiki-relationships/
├── index.ts
├── model.ts
└── service.ts
```

---

### T017: Performance Optimization
**Priority**: P3  
**Estimate**: 45 minutes  
**Dependencies**: T015, T016

**Description**: Performance optimization for large content volumes

**Acceptance Criteria**:
- [ ] Database query optimization with proper indexes
- [ ] Frontend bundle optimization
- [ ] Image loading optimization (lazy loading, compression)
- [ ] Search performance tuning
- [ ] Auto-save debouncing optimization
- [ ] Memory usage optimization for large documents

**Files to Modify**:
- Various service and component files
- Database schema (additional indexes)
- Webpack/Vite configuration optimizations

---

## Summary

### Total Estimated Time: 17.5 hours (2-3 development sessions)

### Phase Breakdown:
- **Phase 1 (P0)**: 6.5 hours - Foundation, database, API, and PDF export
- **Phase 2 (P1)**: 6.25 hours - Admin interface, editor, and core functionality  
- **Phase 3 (P2)**: 3.75 hours - Enhanced features and analytics
- **Phase 4 (P3)**: 2.5 hours - Advanced features and optimization

### Critical Path:
T001 → T002 → T003 → T004 → T005 → T006 → T007/T008 → T009 → T010

### Key Features Delivered:
- **Complete INSTRUCTIONS.md Compliance**: All RF025-RF032 requirements covered
- **BlockNote.js Integration**: Rich text editing with custom medical content blocks
- **PDF Export**: Individual and bulk article export functionality
- **Hierarchical Organization**: Categories (3 levels) and Tags (2 levels) with full management
- **Advanced Search**: Full-text search with filtering and analytics
- **File Management**: Local storage with S3-extensible architecture
- **Analytics Dashboard**: Content usage metrics and performance tracking
- **Role-Based Access**: Both admin and super-admin support
- **Global Error Handling**: Consistent JSON error responses using existing system

### Recommended Implementation Strategy:
1. **Session 1**: Complete Phase 1 (T001-T005) - Establish solid backend foundation
2. **Session 2**: Complete Phase 2 (T006-T010) - Build complete admin interface
3. **Session 3**: Complete Phases 3-4 (T011-T017) - Add enhanced features and optimization

### Risk Mitigation:
- Start with Phase 1 to establish reliable foundation
- Use existing patterns throughout (auth, error handling, component structure)
- Incremental testing at each phase
- Focus on core functionality before advanced features
- Leverage existing BlockNote configuration and ShadCN components

---

## Phase 1: Foundation (P0 - Critical)

### T001: Database Schema Implementation
**Priority**: P0  
**Estimate**: 5 hours  
**Dependencies**: None

**Description**: Create dedicated wiki database schema following existing patterns

**Acceptance Criteria**:
- [ ] Create dedicated `wiki` schema in new file `apps/server/src/db/schema/wiki.ts`
- [ ] Create `wiki_articles` table with all required fields (per RF025-RF028)
- [ ] Create `wiki_categories` table with hierarchical support (per RF030)
- [ ] Create `wiki_tags` table with usage tracking (per RF031)
- [ ] Create `wiki_article_tags` junction table for many-to-many relationships
- [ ] Create `wiki_article_relationships` table for content linking (per RF032)
- [ ] Add proper indexes for performance (search, filtering)
- [ ] Create enum types for article status and relationship types
- [ ] Write database migration scripts
- [ ] Verify foreign key constraints and cascade rules

**Files to Create/Modify**:
- `apps/server/src/db/schema/wiki.ts` (new dedicated schema)
- `apps/server/src/db/migrations/003_create_wiki_schema.sql`
- `apps/server/src/db/index.ts` (export new schema)

**Technical Notes**:
- Follow existing patterns from `questions.ts` but in dedicated namespace
- Use JSONB for BlockNote content storage
- Add full-text search indexes for content discovery
- Design for local file storage with S3 extensibility
- Support both admin and super-admin roles (no additional restrictions)

---

### T002: Enhanced Article Service Layer
**Priority**: P0  
**Estimate**: 8 hours  
**Dependencies**: T001

**Description**: Implement comprehensive business logic for all wiki article operations per INSTRUCTIONS.md requirements

**Acceptance Criteria**:
- [ ] Create ArticleService class with full CRUD operations (RF025-RF028)
- [ ] Implement automatic slug generation from titles with conflict resolution
- [ ] Add reading time calculation algorithm with content type adjustments (RF029)
- [ ] Create content text extraction from BlockNote JSON for search indexing
- [ ] Add comprehensive article validation rules for publication
- [ ] Implement status transition logic (Draft → Published → Archived per RF028)
- [ ] Add analytics tracking for article usage metrics (RF029)
- [ ] Create file storage service with local/S3 extensibility
- [ ] Add proper error handling following Elysia patterns (status returns)
- [ ] Implement content relationship management (RF032)

**Files to Create**:
- `apps/server/src/modules/wiki/services/article-service.ts`
- `apps/server/src/modules/wiki/services/content-processor.ts`
- `apps/server/src/modules/wiki/services/analytics-service.ts`
- `apps/server/src/modules/wiki/services/file-storage-service.ts`
- `apps/server/src/modules/wiki/types/article.ts`
- `apps/server/src/modules/wiki/types/analytics.ts`

**Technical Notes**:
- Reading time: 200 words/minute baseline with BlockNote content type adjustments
- Slug generation: unique, URL-safe, handle conflicts with incremental numbering
- Content validation: minimum length, required fields for publication per RF028
- Analytics: track views, reading time, popular sections per RF029
- File storage: abstracted interface for local storage with S3 migration path

---

### T003: PDF Export Service
**Priority**: P0  
**Estimate**: 6 hours  
**Dependencies**: T002

**Description**: Implement PDF generation service for wiki articles per user requirement

**Acceptance Criteria**:
- [ ] Create PDFService class for article-to-PDF conversion
- [ ] Convert BlockNote JSON content to PDF-compatible format
- [ ] Support rich formatting (headings, lists, images, tables)
- [ ] Add article metadata (title, author, creation date, reading time)
- [ ] Include branded header/footer with organization logo
- [ ] Optimize PDF generation performance (<5s per article)
- [ ] Handle images and media content in PDF output
- [ ] Add error handling for PDF generation failures
- [ ] Support both individual article and bulk PDF generation

**Files to Create**:
- `apps/server/src/modules/wiki/services/pdf-service.ts`
- `apps/server/src/modules/wiki/types/pdf.ts`
- `apps/server/src/modules/wiki/templates/article-pdf-template.ts`

**Technical Notes**:
- Use appropriate PDF generation library (Puppeteer/Playwright for HTML-to-PDF)
- Design for extensibility to support different PDF layouts
- Consider caching for frequently exported articles
- Ensure image handling works with file storage service
- Follow Elysia error handling patterns (status returns, not throws)

---

### T004: Comprehensive Article API Endpoints
**Priority**: P0  
**Estimate**: 10 hours  
**Dependencies**: T003

**Description**: Create complete RESTful API endpoints covering all INSTRUCTIONS.md requirements

**Acceptance Criteria**:
- [ ] GET /api/admin/wiki/articles (list with advanced pagination, search, filtering per RF025)
- [ ] GET /api/admin/wiki/articles/:id (single article with analytics per RF029)
- [ ] POST /api/admin/wiki/articles (create with full validation per RF026)
- [ ] PUT /api/admin/wiki/articles/:id (update with auto-save support per RF027)
- [ ] PATCH /api/admin/wiki/articles/:id/status (publication workflow per RF028)
- [ ] DELETE /api/admin/wiki/articles/:id (soft delete with relationships)
- [ ] GET /api/admin/wiki/articles/:id/pdf (PDF export endpoint)
- [ ] POST /api/admin/wiki/articles/bulk (bulk operations support)
- [ ] GET /api/admin/wiki/articles/:id/related (related content per RF032)
- [ ] Add comprehensive validation using Elysia schemas
- [ ] Implement admin/super-admin role authorization using existing macro
- [ ] Add proper error responses following Elysia patterns
- [ ] Include analytics endpoints for usage tracking (RF029)

**Files to Create**:
- `apps/server/src/modules/wiki/articles.ts`
- `apps/server/src/modules/wiki/analytics.ts`
- `apps/server/src/modules/wiki/bulk-operations.ts`
- `apps/server/src/modules/wiki/index.ts`
- `apps/server/src/modules/wiki/validation/article-schemas.ts`

**Technical Notes**:
- Follow existing API patterns from other modules
- Use Better Auth middleware with both admin and super-admin support
- Implement proper HTTP status codes and error messages per Elysia conventions
- Support advanced search and filtering as per RF025 requirements
- Include pagination metadata for large result sets

---

### T005: API Integration and Comprehensive Testing
**Priority**: P0  
**Estimate**: 6 hours  
**Dependencies**: T004

**Description**: Add comprehensive testing and integration with main app

**Acceptance Criteria**:
- [ ] Unit tests for ArticleService methods (CRUD operations)
- [ ] Unit tests for PDFService functionality
- [ ] Unit tests for analytics tracking
- [ ] Integration tests for all API endpoints
- [ ] Test admin and super-admin authorization requirements
- [ ] Test data validation and error cases for all schemas
- [ ] Test PDF export functionality with various content types
- [ ] Test bulk operations and related content features
- [ ] Add wiki module to main server app
- [ ] Verify API endpoints accessible via client
- [ ] Test file storage service with local storage

**Files to Create**:
- `apps/server/src/modules/wiki/__tests__/article-service.test.ts`
- `apps/server/src/modules/wiki/__tests__/pdf-service.test.ts`
- `apps/server/src/modules/wiki/__tests__/analytics-service.test.ts`
- `apps/server/src/modules/wiki/__tests__/articles.test.ts`
- `apps/server/src/modules/wiki/__tests__/bulk-operations.test.ts`

**Files to Modify**:
- `apps/server/src/index.ts` (add wiki module)

**Technical Notes**:
- Test both success and error scenarios for all operations
- Verify proper role-based access control
- Test PDF generation with various content types and sizes
- Ensure test coverage for all INSTRUCTIONS.md requirements

---

## Phase 2: Admin Interface (P1 - High)

### T006: Enhanced Article Listing Component
**Priority**: P1  
**Estimate**: 8 hours  
**Dependencies**: T005

**Description**: Create comprehensive admin interface for browsing and managing articles per RF025

**Acceptance Criteria**:
- [ ] Article list table with advanced sorting and pagination
- [ ] Multi-criteria filtering (status, category, author, tags, date ranges)
- [ ] Real-time search functionality with highlighting (per RF025)
- [ ] Bulk selection and actions interface
- [ ] Status badges and visual indicators for publication state
- [ ] Quick actions (edit, publish, archive, export PDF)
- [ ] Advanced search with content text search capability
- [ ] Responsive design for different screen sizes
- [ ] Loading states and error handling
- [ ] Export options (PDF single/bulk, CSV metadata)

**Files to Create**:
- `apps/web/src/features/wiki/components/ArticleList.tsx`
- `apps/web/src/features/wiki/components/ArticleFilters.tsx`
- `apps/web/src/features/wiki/components/AdvancedSearch.tsx`
- `apps/web/src/features/wiki/components/ArticleTableColumns.tsx`
- `apps/web/src/features/wiki/components/BulkActions.tsx`
- `apps/web/src/features/wiki/api/articles.ts`
- `apps/web/src/features/wiki/hooks/useArticleList.ts`

**Technical Notes**:
- Use ShadCN DataTable component with custom enhancements
- Implement TanStack Query for data fetching with caching
- Add debounced search to avoid excessive API calls
- Support for complex filter combinations as per RF025

---

### T007: Advanced BlockNote Editor Integration
**Priority**: P1  
**Estimate**: 10 hours  
**Dependencies**: T005

**Description**: Enhance BlockNote editor for comprehensive article creation per RF026-RF027

**Acceptance Criteria**:
- [ ] Auto-save functionality with debouncing and visual indicators (per RF027)
- [ ] Custom medical procedure blocks and warning/alert blocks
- [ ] Image upload integration with local storage service
- [ ] Advanced slash commands for quick medical content insertion
- [ ] Word count and real-time reading time display (per RF029)
- [ ] Content validation feedback and error display
- [ ] Table creation and editing for medical procedures
- [ ] Internal linking between articles (per RF032)
- [ ] Content preview mode matching student view
- [ ] Collaborative editing preparation (future-ready)
- [ ] Undo/redo functionality with version awareness

**Files to Create/Modify**:
- `apps/web/src/features/wiki/components/WikiEditor.tsx`
- `apps/web/src/features/wiki/components/CustomBlocks.tsx`
- `apps/web/src/features/wiki/components/MedicalBlocks.tsx`
- `apps/web/src/features/wiki/components/ImageUpload.tsx`
- `apps/web/src/features/wiki/hooks/useWikiEditor.ts`
- `apps/web/src/features/wiki/hooks/useAutoSave.ts`
- `apps/web/src/features/wiki/utils/contentValidation.ts`

**Technical Notes**:
- Extend existing BlockNote configuration per https://www.blocknotejs.org/docs/
- Add custom block types specific to medical content and procedures
- Implement proper TypeScript types for custom blocks
- Design auto-save to work efficiently with large documents
- Ensure accessibility compliance for editor interface

---

### T008: Comprehensive Article Form with PDF Export
**Priority**: P1  
**Estimate**: 8 hours  
**Dependencies**: T006, T007

**Description**: Complete article creation and editing interface with export functionality

**Acceptance Criteria**:
- [ ] Article metadata form (title, category, tags, SEO fields) per RF026
- [ ] Integration with enhanced BlockNote editor
- [ ] Draft saving and auto-save indicators with conflict resolution
- [ ] Publication validation and preview mode (per RF028)
- [ ] Category selection with hierarchical display (per RF030)
- [ ] Tag management with auto-complete and creation (per RF031)
- [ ] Related content suggestion and management (per RF032)
- [ ] PDF export button with progress indicator
- [ ] SEO fields (meta description, featured image, slug customization)
- [ ] Form validation with comprehensive error messages
- [ ] Analytics preview (reading time, content metrics per RF029)

**Files to Create**:
- `apps/web/src/features/wiki/components/ArticleForm.tsx`
- `apps/web/src/features/wiki/components/ArticleMetadata.tsx`
- `apps/web/src/features/wiki/components/CategorySelector.tsx`
- `apps/web/src/features/wiki/components/TagManager.tsx`
- `apps/web/src/features/wiki/components/RelatedContentManager.tsx`
- `apps/web/src/features/wiki/components/PDFExport.tsx`
- `apps/web/src/features/wiki/validation/article-schema.ts`
- `apps/web/src/routes/_auth/admin/wiki/articles/new.tsx`
- `apps/web/src/routes/_auth/admin/wiki/articles/$id/edit.tsx`

**Technical Notes**:
- Use React Hook Form for complex form management
- Integrate with existing validation patterns
- Handle file uploads for featured images with preview
- Implement PDF export with loading states and error handling

---

### T009: Navigation and Protected Routing
**Priority**: P1  
**Estimate**: 4 hours  
**Dependencies**: T008

**Description**: Set up routing and navigation for wiki admin with proper access control

**Acceptance Criteria**:
- [ ] Protected admin routes under `/admin/wiki` (accessible to admin and super-admin)
- [ ] Navigation menu integration with wiki management sections
- [ ] Breadcrumb navigation for deep article management
- [ ] Route guards using existing auth macro (no additional role restrictions)
- [ ] Loading states for route transitions with skeleton components
- [ ] Error boundaries for route-level error handling
- [ ] Deep linking support for article editing and creation

**Files to Create/Modify**:
- `apps/web/src/routes/_auth/admin/wiki/index.tsx`
- `apps/web/src/routes/_auth/admin/wiki/articles/index.tsx`
- `apps/web/src/routes/_auth/admin/wiki/categories/index.tsx`
- `apps/web/src/features/wiki/components/WikiNavigation.tsx`
- Update existing navigation components to include wiki section

**Technical Notes**:
- Follow existing admin route patterns from other modules
- Use TanStack Router file-based routing system
- Ensure consistent navigation UX with existing admin sections
- Support both admin and super-admin roles without additional restrictions

---

### T010: Analytics Dashboard Implementation
**Priority**: P2  
**Estimate**: 6 hours  
**Dependencies**: T009

**Description**: Implement comprehensive analytics dashboard per RF029 requirements

**Acceptance Criteria**:
- [ ] Article performance metrics dashboard (views, reading time, engagement)
- [ ] Category and tag usage analytics with visual charts
- [ ] Author productivity metrics and content statistics
- [ ] Popular content identification and trending articles
- [ ] Reading time accuracy validation and optimization
- [ ] Content usage patterns and student engagement insights
- [ ] Export analytics data to CSV/PDF reports
- [ ] Real-time metrics updates and historical data tracking

**Files to Create**:
- `apps/web/src/features/wiki/components/AnalyticsDashboard.tsx`
- `apps/web/src/features/wiki/components/ContentMetrics.tsx`
- `apps/web/src/features/wiki/components/UsageCharts.tsx`
- `apps/web/src/features/wiki/api/analytics.ts`
- `apps/web/src/routes/_auth/admin/wiki/analytics/index.tsx`

**Technical Notes**:
- Use charting library (Chart.js/Recharts) for data visualization
- Implement real-time updates with proper caching
- Design for scalability with large content volumes
- Include proper loading states and error handling

---

## Phase 3: Enhanced Features (P2 - Medium)

### T011: Category Management Interface
**Priority**: P2  
**Estimate**: 5 hours  
**Dependencies**: T008

**Description**: Admin interface for managing content categories

**Acceptance Criteria**:
- [ ] Hierarchical category tree view
- [ ] Create, edit, delete categories
- [ ] Color coding and descriptions
- [ ] Drag-and-drop category reordering
- [ ] Bulk article reassignment
- [ ] Category usage statistics

**Files to Create**:
- `apps/web/src/features/wiki/components/CategoryTree.tsx`
- `apps/web/src/features/wiki/components/CategoryForm.tsx`
- `apps/web/src/routes/_auth/admin/wiki/categories/index.tsx`
- `apps/server/src/modules/wiki/categories.ts`

---

### T010: Publication Workflow
**Priority**: P2  
**Estimate**: 4 hours  
**Dependencies**: T007

**Description**: Enhanced publication workflow with status management

**Acceptance Criteria**:
- [ ] Publish/unpublish actions with validation
- [ ] Preview mode showing student view
- [ ] Publication status dashboard
- [ ] Automated validation before publishing
- [ ] Publication scheduling (future enhancement)

**Files to Create**:
- `apps/web/src/features/wiki/components/PublicationWorkflow.tsx`
- `apps/web/src/features/wiki/components/ArticlePreview.tsx`
- `apps/server/src/modules/wiki/articles/publication.ts`

---

### T011: Search and Advanced Filtering
**Priority**: P2  
**Estimate**: 6 hours  
**Dependencies**: T005

**Description**: Enhanced search and filtering capabilities

**Acceptance Criteria**:
- [ ] Full-text search across title and content
- [ ] Advanced filter combinations
- [ ] Search result highlighting
- [ ] Saved filter presets
- [ ] Search performance optimization

**Files to Create/Modify**:
- `apps/server/src/modules/wiki/services/search-service.ts`
- `apps/web/src/features/wiki/components/AdvancedSearch.tsx`
- Enhance existing filter components

**Technical Notes**:
- Use PostgreSQL full-text search capabilities
- Implement search result ranking
- Add search analytics

---

### T012: Bulk Operations
**Priority**: P2  
**Estimate**: 4 hours  
**Dependencies**: T010

**Description**: Bulk operations for managing multiple articles

**Acceptance Criteria**:
- [ ] Multi-select article interface
- [ ] Bulk status changes (publish, archive)
- [ ] Bulk category and tag assignment
- [ ] Progress indicators for bulk operations
- [ ] Rollback capabilities for failed operations

**Files to Create**:
- `apps/web/src/features/wiki/components/BulkOperations.tsx`
- `apps/server/src/modules/wiki/articles/bulk.ts`

---

## Phase 4: Advanced Features (P3 - Low)

### T013: Content Relationships
**Priority**: P3  
**Estimate**: 5 hours  
**Dependencies**: T010

**Description**: Manage relationships between articles

**Acceptance Criteria**:
- [ ] Link articles as related, prerequisites, continuations
- [ ] Visual relationship management interface
- [ ] Automatic relationship suggestions
- [ ] Relationship validation and integrity

**Files to Create**:
- `apps/web/src/features/wiki/components/ArticleRelationships.tsx`
- `apps/server/src/modules/wiki/services/relationship-service.ts`

---

### T014: Analytics and Metrics
**Priority**: P3  
**Estimate**: 4 hours  
**Dependencies**: T012

**Description**: Content analytics and usage metrics

**Acceptance Criteria**:
- [ ] Article view tracking and statistics
- [ ] Popular content identification
- [ ] Category usage analytics
- [ ] Author productivity metrics

**Files to Create**:
- `apps/web/src/features/wiki/components/WikiAnalytics.tsx`
- `apps/server/src/modules/wiki/services/analytics-service.ts`

---

### T015: Image Upload and Management
**Priority**: P3  
**Estimate**: 6 hours  
**Dependencies**: T006

**Description**: Enhanced image handling for article content

**Acceptance Criteria**:
- [ ] Drag-and-drop image upload
- [ ] Image compression and optimization
- [ ] Alt text management
- [ ] Image gallery for reuse
- [ ] CDN integration

**Files to Create**:
- `apps/web/src/features/wiki/components/ImageUpload.tsx`
- `apps/web/src/features/wiki/components/ImageGallery.tsx`
- `apps/server/src/modules/wiki/services/image-service.ts`

---

### T016: Performance Optimization
**Priority**: P3  
**Estimate**: 3 hours  
**Dependencies**: T015

**Description**: Optimize performance for large content volumes

**Acceptance Criteria**:
- [ ] Implement query optimization
- [ ] Add caching for published articles
- [ ] Optimize editor loading performance
- [ ] Add performance monitoring

**Files to Modify**:
- Various service and component files
- Add caching middleware
- Database query optimization

---

## Summary

### Total Estimated Time: 110 hours (13.75 developer days)

### Phase Breakdown:
- **Phase 1 (P0)**: 35 hours - Foundation, core functionality, and PDF export
- **Phase 2 (P1)**: 30 hours - Enhanced admin interface and comprehensive features  
- **Phase 3 (P2)**: 25 hours - Advanced features, analytics, and category management
- **Phase 4 (P3)**: 20 hours - Optimization, relationships, and performance

### Critical Path:
T001 → T002 → T003 → T004 → T005 → T006/T007 → T008 → T009 → T010

### Enhanced Features Summary:
- **Complete INSTRUCTIONS.md Compliance**: Covers all RF025-RF032 requirements
- **PDF Export**: Comprehensive PDF generation for individual and bulk articles
- **Advanced Analytics**: Usage tracking, reading time analytics, content metrics (RF029)
- **Enhanced Search**: Full-text search with advanced filtering (RF025)  
- **Category Management**: Hierarchical organization with drag-and-drop (RF030)
- **Tag System**: Advanced tagging with auto-complete and management (RF031)
- **Content Relationships**: Smart content linking and suggestions (RF032)
- **Role Support**: Both admin and super-admin access without additional restrictions

### Recommended Sprint Planning:
- **Sprint 1**: T001-T005 (Foundation with PDF Export)
- **Sprint 2**: T006-T009 (Core Admin Interface)  
- **Sprint 3**: T010-T013 (Enhanced Features and Analytics)
- **Sprint 4**: T014-T017 (Advanced Features and Optimization)

### Testing Strategy:
- Unit tests for all service layer components
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user workflows

### Risk Mitigation:
- Start with Phase 1 to establish solid foundation
- Implement basic editor first before custom blocks
- Add comprehensive error handling throughout
- Plan for incremental deployment and rollback