# Contract: Wiki Article API

**Branch**: `003-wiki-admin-panel` | **Date**: 2025-01-26  
**Purpose**: API endpoints for CRUD operations on wiki articles

---

## Base URL
```
/api/admin/wiki/articles
```

## Authentication
- **Required**: Bearer token with admin role
- **Headers**: `Authorization: Bearer <token>`
- **Validation**: Better Auth middleware validates admin permissions

---

## Endpoints

### GET /api/admin/wiki/articles
**Purpose**: List articles with filtering and pagination

**Query Parameters**:
```typescript
interface ArticleListQuery {
  page?: number;           // Default: 1
  limit?: number;          // Default: 10, Max: 50
  status?: 'draft' | 'published' | 'archived' | 'all';  // Default: all
  category_id?: number;    // Filter by category
  author_id?: string;      // Filter by author
  search?: string;         // Full-text search
  tags?: string[];         // Filter by tag names
  sort?: 'created_at' | 'updated_at' | 'title' | 'view_count';
  order?: 'asc' | 'desc';  // Default: desc
}
```

**Response**:
```typescript
interface ArticleListResponse {
  articles: ArticleListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    categories: CategoryOption[];
    authors: AuthorOption[];
    available_tags: TagOption[];
  };
}

interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'published' | 'archived';
  reading_time_minutes: number;
  view_count: number;
  category: {
    id: number;
    name: string;
    color: string;
  } | null;
  author: {
    id: string;
    name: string;
    email: string;
  };
  tags: TagOption[];
  created_at: string;      // ISO string
  updated_at: string;      // ISO string
  published_at: string | null;
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid query parameters
- `401`: Unauthorized
- `403`: Insufficient permissions

---

### GET /api/admin/wiki/articles/:id
**Purpose**: Get single article with full content

**Path Parameters**:
- `id`: Article ID (integer)

**Response**:
```typescript
interface ArticleDetailResponse {
  id: number;
  title: string;
  slug: string;
  content: object;         // BlockNote JSON content
  content_text: string;    // Plain text version
  excerpt: string;
  meta_description: string | null;
  featured_image_url: string | null;
  status: 'draft' | 'published' | 'archived';
  reading_time_minutes: number;
  view_count: number;
  category: {
    id: number;
    name: string;
    color: string;
    parent_id: number | null;
  } | null;
  author: {
    id: string;
    name: string;
    email: string;
  };
  tags: TagOption[];
  relationships: {
    related: ArticleReference[];
    prerequisites: ArticleReference[];
    continuations: ArticleReference[];
  };
  created_at: string;
  updated_at: string;
  published_at: string | null;
  last_viewed_at: string | null;
}

interface ArticleReference {
  id: number;
  title: string;
  slug: string;
  status: string;
}
```

**Status Codes**:
- `200`: Success
- `404`: Article not found
- `401`: Unauthorized
- `403`: Insufficient permissions

---

### POST /api/admin/wiki/articles
**Purpose**: Create new article

**Request Body**:
```typescript
interface CreateArticleRequest {
  title: string;           // 5-200 characters
  content: object;         // BlockNote JSON content
  excerpt?: string;        // Auto-generated if not provided
  meta_description?: string; // Max 160 characters
  featured_image_url?: string;
  category_id?: number;    // Must exist and be active
  tag_ids?: number[];      // Must exist
  status?: 'draft' | 'published'; // Default: draft
}
```

**Response**:
```typescript
interface CreateArticleResponse {
  article: ArticleDetailResponse;
}
```

**Validation Rules**:
- Title: 5-200 characters, unique slug generation
- Content: Valid BlockNote JSON structure
- Category: Must exist and be active (if provided)
- Tags: All tag IDs must exist
- Published articles: Must have category_id

**Status Codes**:
- `201`: Article created successfully
- `400`: Validation errors
- `401`: Unauthorized
- `403`: Insufficient permissions
- `409`: Slug conflict (auto-generated slug already exists)

---

### PUT /api/admin/wiki/articles/:id
**Purpose**: Update existing article

**Path Parameters**:
- `id`: Article ID (integer)

**Request Body**: Same as `CreateArticleRequest` (all fields optional)

**Response**: Same as `CreateArticleResponse`

**Business Rules**:
- Slug regenerated if title changes
- Reading time recalculated if content changes
- Published timestamp set when status changes to 'published'
- Content_text extracted from BlockNote JSON content

**Status Codes**:
- `200`: Article updated successfully
- `400`: Validation errors
- `404`: Article not found
- `409`: Slug conflict
- `401`: Unauthorized
- `403`: Insufficient permissions

---

### DELETE /api/admin/wiki/articles/:id
**Purpose**: Soft delete article (archive)

**Path Parameters**:
- `id`: Article ID (integer)

**Response**:
```typescript
interface DeleteArticleResponse {
  message: string;
  archived_at: string;
}
```

**Business Rules**:
- Sets status to 'archived'
- Preserves all data for potential recovery
- Removes from public listings
- Maintains relationships for admin reference

**Status Codes**:
- `200`: Article archived successfully
- `404`: Article not found
- `401`: Unauthorized
- `403`: Insufficient permissions

---

### POST /api/admin/wiki/articles/:id/publish
**Purpose**: Publish draft article

**Path Parameters**:
- `id`: Article ID (integer)

**Response**:
```typescript
interface PublishArticleResponse {
  article: ArticleDetailResponse;
  published_at: string;
}
```

**Validation**:
- Article must be in 'draft' status
- Must have title, content (>50 chars), and category
- Sets published_at timestamp

**Status Codes**:
- `200`: Article published successfully
- `400`: Validation errors or already published
- `404`: Article not found
- `401`: Unauthorized
- `403`: Insufficient permissions

---

### POST /api/admin/wiki/articles/:id/unpublish
**Purpose**: Revert published article to draft

**Path Parameters**:
- `id`: Article ID (integer)

**Response**:
```typescript
interface UnpublishArticleResponse {
  article: ArticleDetailResponse;
  unpublished_at: string;
}
```

**Business Rules**:
- Changes status from 'published' to 'draft'
- Clears published_at timestamp
- Removes from public wiki immediately

**Status Codes**:
- `200`: Article unpublished successfully
- `400`: Article not published
- `404`: Article not found
- `401`: Unauthorized
- `403`: Insufficient permissions

---

### POST /api/admin/wiki/articles/bulk
**Purpose**: Bulk operations on multiple articles

**Request Body**:
```typescript
interface BulkOperationRequest {
  article_ids: number[];
  operation: 'publish' | 'unpublish' | 'archive' | 'update_category' | 'add_tags' | 'remove_tags';
  parameters?: {
    category_id?: number;    // For update_category
    tag_ids?: number[];      // For add_tags/remove_tags
  };
}
```

**Response**:
```typescript
interface BulkOperationResponse {
  successful: number[];     // Article IDs that succeeded
  failed: {
    article_id: number;
    error: string;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
```

**Status Codes**:
- `200`: Bulk operation completed (check individual results)
- `400`: Invalid operation or parameters
- `401`: Unauthorized
- `403`: Insufficient permissions

---

## Error Responses

### Standard Error Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: object;
  };
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `ARTICLE_NOT_FOUND`: Article doesn't exist
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `SLUG_CONFLICT`: Generated slug already exists
- `INVALID_STATUS_TRANSITION`: Cannot change status as requested
- `CATEGORY_NOT_FOUND`: Referenced category doesn't exist
- `TAG_NOT_FOUND`: Referenced tag doesn't exist

---

## Rate Limiting
- **General**: 100 requests per minute per user
- **Bulk Operations**: 10 requests per minute per user
- **Content Updates**: 30 requests per minute per user

---

## Caching Strategy
- **Article Lists**: Cache for 5 minutes (invalidate on any article change)
- **Individual Articles**: Cache published articles for 1 hour
- **Filter Options**: Cache categories/tags for 10 minutes
- **Search Results**: No caching (always fresh)