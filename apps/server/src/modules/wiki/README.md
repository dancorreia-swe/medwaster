# Wiki Module Structure

Separation between admin and user/student wiki functionality.

## File Structure

```
wiki/
├── articles.ts        # Admin & User route handlers
├── index.ts          # Module exports
├── services/
│   └── article-service.ts
└── types/
    └── article.ts
```

## Route Organization

### Admin Routes (`/admin/wiki/articles`)

**Purpose:** Full CRUD and content management

**Endpoints:**
```
GET    /admin/wiki/articles           # List all articles (any status)
GET    /admin/wiki/articles/:id       # Get article for editing
POST   /admin/wiki/articles           # Create new article
PUT    /admin/wiki/articles/:id       # Update article
DELETE /admin/wiki/articles/:id       # Archive article
POST   /admin/wiki/articles/:id/publish    # Publish article
POST   /admin/wiki/articles/:id/unpublish  # Unpublish article
GET    /admin/wiki/articles/stats     # Article statistics
```

**Auth:** Requires `admin` or `super_admin` role

**Features:**
- Access to all articles (draft, published, archived)
- Full CRUD operations
- Publish/unpublish control
- Analytics and statistics

---

### User/Student Routes (`/wiki/articles`)

**Purpose:** Reading, bookmarks, and progress tracking

**Endpoints:**
```
# Reading
GET    /wiki/articles                 # List published articles only
GET    /wiki/articles/:id             # Read article (tracks view)

# Bookmarks
POST   /wiki/articles/:id/bookmark    # Add bookmark
DELETE /wiki/articles/:id/bookmark    # Remove bookmark
PUT    /wiki/articles/:id/bookmark/notes  # Update bookmark notes
GET    /wiki/articles/bookmarks       # Get user's bookmarks

# Reading Progress
PUT    /wiki/articles/:id/progress    # Update reading progress
POST   /wiki/articles/:id/mark-read   # Mark as read
GET    /wiki/articles/reading-list    # Unread articles
GET    /wiki/articles/reading-history # Read articles
```

**Auth:** Requires `student` role

**Features:**
- Read-only article access (published only)
- Bookmark management with notes
- Reading progress tracking
- Reading lists (to-read, history)

---

## Implementation Details

### articles.ts

Two separate Elysia instances:

1. **`adminArticles`** - Admin routes with full permissions
2. **`userArticles`** - Student routes with read-only + tracking

Both use `betterAuthMacro` for authentication but with different role requirements.

### index.ts

Exports two modules:

1. **`adminWiki`** - Mounted at `/admin/wiki`
   - Includes `adminArticles`
   - Includes `wikiFiles` (file management)

2. **`wiki`** - Mounted at `/wiki`
   - Includes `userArticles`
   - User-facing routes only

---

## Service Layer (ArticleService)

New methods needed for user features:

```typescript
class ArticleService {
  // Existing admin methods
  static listArticles(query)
  static getArticleById(id)
  static createArticle(data, authorId)
  static updateArticle(id, data, authorId)
  static archiveArticle(id)
  static publishArticle(id)
  static unpublishArticle(id)
  static getStats()

  // New user methods
  static listPublishedArticles(query)
  static getPublishedArticleById(id, userId)  // Track view
  
  // Bookmarks
  static addBookmark(userId, articleId, notes?)
  static removeBookmark(userId, articleId)
  static updateBookmarkNotes(userId, articleId, notes)
  static getUserBookmarks(userId)
  
  // Reading Progress
  static updateReadProgress(userId, articleId, data)
  static markAsRead(userId, articleId)
  static getReadingList(userId)      // Unread articles
  static getReadingHistory(userId)   // Read articles
}
```

---

## Example Usage

### Admin Flow
```typescript
// Admin creates article
POST /admin/wiki/articles
{
  "title": "Sharps Disposal",
  "content": {...},
  "categoryId": 1
}

// Admin publishes
POST /admin/wiki/articles/42/publish

// Check stats
GET /admin/wiki/articles/stats
```

### Student Flow
```typescript
// Student browses published articles
GET /wiki/articles
→ Returns only published articles

// Student reads article (auto-tracks view)
GET /wiki/articles/42
→ Creates user_article_reads record

// Student bookmarks article
POST /wiki/articles/42/bookmark
{
  "notes": "Important for exam"
}

// Student updates reading progress (auto-saved during scroll)
PUT /wiki/articles/42/progress
{
  "readPercentage": 65,
  "timeSpentSeconds": 180
}

// Student marks as read
POST /wiki/articles/42/mark-read

// Get bookmarked articles
GET /wiki/articles/bookmarks
```

---

## Security Considerations

1. **Role Separation**
   - Admin routes only accessible by admin/super_admin
   - Student routes only accessible by students
   - Prevents privilege escalation

2. **Data Filtering**
   - Students only see published articles
   - Admins see all articles (any status)

3. **User Isolation**
   - Bookmarks/progress tied to user ID
   - Users can't access others' bookmarks

4. **Input Validation**
   - All routes use Elysia schema validation
   - Type-safe with TypeScript

---

## Next Steps

1. **Implement Service Methods**
   - Add new methods to ArticleService
   - Integrate with wiki bookmark/read schemas

2. **Add Middleware**
   - View tracking (increment view count)
   - Reading time calculation
   - Gamification hooks (missions, achievements)

3. **Testing**
   - Admin CRUD operations
   - Student bookmark operations
   - Progress tracking accuracy
   - Role-based access control

4. **Frontend Integration**
   - Admin article editor
   - Student reading interface
   - Bookmark UI
   - Progress indicators
