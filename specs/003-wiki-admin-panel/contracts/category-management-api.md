# Contract: Category Management API

**Branch**: `003-wiki-admin-panel` | **Date**: 2025-01-26  
**Purpose**: API endpoints for managing hierarchical content categories

---

## Base URL
```
/api/admin/wiki/categories
```

## Authentication
- **Required**: Bearer token with admin role
- **Headers**: `Authorization: Bearer <token>`

---

## Endpoints

### GET /api/admin/wiki/categories
**Purpose**: Get hierarchical list of categories

**Query Parameters**:
```typescript
interface CategoryListQuery {
  type?: 'wiki' | 'question' | 'track' | 'all';  // Default: wiki
  include_inactive?: boolean;  // Default: false
  flat?: boolean;             // Default: false (return hierarchy)
}
```

**Response**:
```typescript
interface CategoryListResponse {
  categories: CategoryNode[];
  flat_list: CategoryOption[];  // For dropdown usage
}

interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  type: 'wiki' | 'question' | 'track' | 'quiz' | 'general';
  is_active: boolean;
  parent_id: number | null;
  children: CategoryNode[];     // Nested children
  article_count: number;        // Articles in this category
  total_article_count: number;  // Including children
  created_at: string;
  updated_at: string;
}

interface CategoryOption {
  id: number;
  name: string;
  color: string;
  level: number;               // 0 = root, 1 = child, 2 = grandchild
  path: string;                // "Parent > Child > Grandchild"
  is_active: boolean;
}
```

---

### GET /api/admin/wiki/categories/:id
**Purpose**: Get single category with details

**Response**:
```typescript
interface CategoryDetailResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  type: 'wiki' | 'question' | 'track' | 'quiz' | 'general';
  is_active: boolean;
  parent_id: number | null;
  parent?: CategoryOption;
  children: CategoryOption[];
  ancestors: CategoryOption[];  // Path to root
  article_count: number;
  recent_articles: ArticleReference[];  // Last 5 articles
  created_at: string;
  updated_at: string;
}
```

---

### POST /api/admin/wiki/categories
**Purpose**: Create new category

**Request Body**:
```typescript
interface CreateCategoryRequest {
  name: string;              // 3-100 characters, unique within parent
  description?: string;      // Max 500 characters
  color?: string;           // Hex color code, auto-generated if not provided
  type: 'wiki' | 'question' | 'track' | 'quiz' | 'general';
  parent_id?: number;       // Must exist and be max level 2
  is_active?: boolean;      // Default: true
}
```

**Validation Rules**:
- Name: 3-100 characters, unique within same parent
- Parent: Maximum 3 levels deep (grandparent > parent > child)
- Color: Valid hex color code (#RRGGBB)
- No circular references in hierarchy

**Response**:
```typescript
interface CreateCategoryResponse {
  category: CategoryDetailResponse;
}
```

---

### PUT /api/admin/wiki/categories/:id
**Purpose**: Update existing category

**Request Body**: Same as `CreateCategoryRequest` (all fields optional)

**Business Rules**:
- Cannot move category if it would create circular reference
- Cannot change parent if it would exceed 3-level limit
- Slug regenerated if name changes
- Moving category moves all children

---

### DELETE /api/admin/wiki/categories/:id
**Purpose**: Delete category (soft delete)

**Query Parameters**:
```typescript
interface DeleteCategoryQuery {
  reassign_to?: number;      // Category ID to move articles to
  force?: boolean;           // Delete even if has articles (archive them)
}
```

**Business Rules**:
- Cannot delete if has articles (unless force=true or reassign_to provided)
- Cannot delete if has child categories
- Soft delete (sets is_active=false) preserves data

---

### POST /api/admin/wiki/categories/:id/move
**Purpose**: Move category to different parent

**Request Body**:
```typescript
interface MoveCategoryRequest {
  new_parent_id: number | null;  // null = move to root level
}
```

**Validation**:
- Cannot create circular references
- Cannot exceed 3-level hierarchy
- All children move with parent

---

### GET /api/admin/wiki/categories/:id/articles
**Purpose**: Get articles in specific category

**Query Parameters**:
```typescript
interface CategoryArticlesQuery {
  include_children?: boolean;  // Include articles from child categories
  status?: 'draft' | 'published' | 'archived' | 'all';
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
interface CategoryArticlesResponse {
  articles: ArticleListItem[];
  pagination: PaginationInfo;
  category: CategoryOption;
}
```

---

## Error Codes
- `CATEGORY_NOT_FOUND`: Category doesn't exist
- `HIERARCHY_LIMIT_EXCEEDED`: Would exceed 3-level limit
- `CIRCULAR_REFERENCE`: Would create circular hierarchy
- `HAS_ARTICLES`: Cannot delete category with articles
- `HAS_CHILDREN`: Cannot delete category with child categories
- `NAME_CONFLICT`: Category name already exists in parent