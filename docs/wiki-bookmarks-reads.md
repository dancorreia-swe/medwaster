# Wiki Bookmarks & Reading Progress Documentation

Added bookmark and read tracking functionality to the wiki schema.

## New Tables

### 1. `user_article_bookmarks`

Allows users to bookmark (save/favorite) articles for later reading.

**Fields:**
- `userId` + `articleId`: Composite primary key
- `notes`: Optional personal notes about the article
- `createdAt`: When bookmark was added
- `updatedAt`: Last time bookmark/notes were updated

**Use Cases:**
- Save articles for later reading
- Create reading lists
- Add personal annotations
- Quick access to favorite articles

**Example Operations:**
```typescript
// Add bookmark
await db.userArticleBookmarks.insert({
  userId: "user123",
  articleId: 42,
  notes: "Important info about sharps disposal"
});

// Remove bookmark
await db.userArticleBookmarks.delete({
  where: {
    userId: "user123",
    articleId: 42
  }
});

// Update notes
await db.userArticleBookmarks.update({
  where: {
    userId_articleId: { userId: "user123", articleId: 42 }
  },
  data: {
    notes: "Updated notes"
  }
});

// Get user's bookmarks
const bookmarks = await db.userArticleBookmarks.findMany({
  where: { userId: "user123" },
  include: { article: true },
  orderBy: { createdAt: 'desc' }
});
```

### 2. `user_article_reads`

Tracks reading progress and completion status for articles.

**Fields:**
- `userId` + `articleId`: User and article pair
- `isRead`: Boolean flag for "mark as read"
- `readPercentage`: How much of article was scrolled (0-100)
- `timeSpentSeconds`: Total time spent on article
- `firstReadAt`: First time user opened article
- `lastReadAt`: Most recent view
- `markedReadAt`: When user manually marked as read

**Use Cases:**
- Track which articles user has read
- Show reading progress
- Calculate time spent learning
- Suggest unread articles
- Analytics on popular articles

**Reading States:**
```typescript
Not Started: No record exists
In Progress: readPercentage > 0 && readPercentage < 100
Completed:   readPercentage === 100 || isRead === true
```

**Automatic Updates:**
```typescript
// User opens article (first time)
await db.userArticleReads.insert({
  userId: "user123",
  articleId: 42,
  readPercentage: 0,
  timeSpentSeconds: 0,
  firstReadAt: now(),
  lastReadAt: now()
});

// User scrolls through article (periodic updates)
await db.userArticleReads.update({
  where: { userId_articleId: { userId: "user123", articleId: 42 } },
  data: {
    readPercentage: 75,
    timeSpentSeconds: { increment: 30 },
    lastReadAt: now()
  }
});

// User manually marks as read
await db.userArticleReads.update({
  where: { userId_articleId: { userId: "user123", articleId: 42 } },
  data: {
    isRead: true,
    readPercentage: 100,
    markedReadAt: now()
  }
});
```

## Relationships

```
user (1) ----< (N) user_article_bookmarks (N) >---- (1) wiki_articles

user (1) ----< (N) user_article_reads (N) >---- (1) wiki_articles
```

## Indexes Created

**user_article_bookmarks:**
- `userId` - User's bookmarks lookup
- `articleId` - Article bookmark count
- `createdAt` - Chronological ordering

**user_article_reads:**
- `userId` - User's reading history
- `articleId` - Article read count
- `userId` + `articleId` - Combined lookup
- `isRead` - Filter read/unread
- `lastReadAt` - Recently read articles

## Integration with Gamification

Reading tracking integrates with daily missions:

```typescript
// When user reads an article
async function onArticleRead(userId: string, articleId: number) {
  // Update read status
  const read = await db.userArticleReads.upsert({
    where: { userId_articleId: { userId, articleId } },
    update: { 
      readPercentage: 100, 
      isRead: true,
      markedReadAt: now()
    },
    create: {
      userId,
      articleId,
      readPercentage: 100,
      isRead: true,
      firstReadAt: now(),
      lastReadAt: now(),
      markedReadAt: now()
    }
  });
  
  // Update daily activity
  await updateDailyActivity(userId, { articlesRead: { increment: 1 } });
  
  // Update missions
  await updateMissionProgress(userId, 'read_article');
}
```

## API Endpoints (Suggested)

```typescript
// Bookmarks
POST   /api/wiki/articles/:id/bookmark        // Add bookmark
DELETE /api/wiki/articles/:id/bookmark        // Remove bookmark
PUT    /api/wiki/articles/:id/bookmark/notes  // Update notes
GET    /api/wiki/bookmarks                    // Get user's bookmarks

// Reading Progress
GET    /api/wiki/articles/:id/progress        // Get reading progress
PUT    /api/wiki/articles/:id/progress        // Update progress
POST   /api/wiki/articles/:id/mark-read       // Mark as read/unread
GET    /api/wiki/reading-list                 // Get unread articles
GET    /api/wiki/reading-history              // Get read articles

// Combined
GET    /api/wiki/articles/:id                 // Include bookmark + progress
Response: {
  article: { ... },
  isBookmarked: true,
  bookmarkNotes: "...",
  readProgress: {
    isRead: false,
    percentage: 65,
    timeSpent: 420,
    lastRead: "2025-01-15T10:30:00Z"
  }
}
```

## UI Components

### Article List Item
```
┌─────────────────────────────────────┐
│ 📄 Sharps Container Guidelines      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━ 65% read  │
│                                     │
│ 5 min read • Last read 2 days ago  │
│ ⭐ Bookmarked • "Important ref"    │
└─────────────────────────────────────┘
```

### Article Header
```
┌─────────────────────────────────────┐
│ Sharps Container Guidelines         │
│                                     │
│ [🔖 Bookmark] [✓ Mark as Read]     │
└─────────────────────────────────────┘
```

### Reading Progress Bar
```
Article Progress: ▓▓▓▓▓▓▓░░░ 65%
```

### Bookmarks List
```
My Bookmarks (12)

[x] Sharps Disposal Methods
    "Check autoclave temps" • 3 days ago
    
[x] Biohazard Bag Selection
    "Color coding reference" • 1 week ago
```

### Reading List
```
To Read (8)                 Recently Read (24)

○ Container Safety          ✓ Sharps Guidelines
  5 min read                  Read 2 days ago
                             
○ Waste Segregation         ✓ PPE Requirements
  8 min read                  Read 1 week ago
```

## Business Logic Examples

### Track Reading Progress
```typescript
// Auto-update as user scrolls
let lastUpdate = Date.now();
const scrollThrottle = 5000; // 5 seconds

window.addEventListener('scroll', async () => {
  if (Date.now() - lastUpdate < scrollThrottle) return;
  
  const percentage = calculateScrollPercentage();
  const timeSpent = Math.floor((Date.now() - pageOpenTime) / 1000);
  
  await fetch(`/api/wiki/articles/${articleId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ percentage, timeSpent })
  });
  
  lastUpdate = Date.now();
});
```

### Smart Read Detection
```typescript
// Auto-mark as read when user reaches end
if (readPercentage >= 90 && timeSpent >= estimatedReadTime * 0.5) {
  await markAsRead(userId, articleId);
}
```

### Reading Recommendations
```typescript
// Suggest unread articles in same category
async function getRecommendations(userId: string) {
  const readArticleIds = await db.userArticleReads
    .findMany({ where: { userId, isRead: true } })
    .map(r => r.articleId);
  
  return await db.wikiArticles.findMany({
    where: {
      id: { notIn: readArticleIds },
      status: 'published'
    },
    take: 10,
    orderBy: { viewCount: 'desc' }
  });
}
```

## Statistics & Analytics

### User Stats
```typescript
interface UserReadingStats {
  totalArticlesRead: number;
  totalTimeSpentMinutes: number;
  averageReadTime: number;
  bookmarksCount: number;
  readingStreak: number;
  articlesInProgress: number;
}
```

### Article Stats
```typescript
interface ArticleStats {
  totalViews: number;
  uniqueReaders: number;
  completionRate: number; // % who read to end
  averageTimeSpent: number;
  bookmarkCount: number;
}
```

### Query Examples
```sql
-- User's reading stats
SELECT 
  COUNT(*) FILTER (WHERE is_read = true) as articles_read,
  SUM(time_spent_seconds) / 60 as total_minutes,
  AVG(time_spent_seconds) FILTER (WHERE is_read = true) as avg_time
FROM user_article_reads
WHERE user_id = ?;

-- Article completion rate
SELECT 
  COUNT(*) FILTER (WHERE read_percentage = 100) * 100.0 / COUNT(*) as completion_rate
FROM user_article_reads
WHERE article_id = ?;

-- Popular but unread articles
SELECT a.*
FROM wiki_articles a
LEFT JOIN user_article_reads r ON a.id = r.article_id AND r.user_id = ?
WHERE r.id IS NULL
  AND a.status = 'published'
ORDER BY a.view_count DESC
LIMIT 10;
```

## Mobile App Features

### 1. Offline Reading List
- Bookmark articles to read offline
- Download bookmarked articles
- Sync progress when back online

### 2. Reading Goals
- "Read 5 articles this week"
- Progress toward goal
- Completion celebration

### 3. Quick Actions
- Swipe to bookmark
- Long-press to mark as read
- Share article

### 4. Smart Notifications
- "You have 3 bookmarked articles to read"
- "New article in category you follow"
- "Complete reading to unlock achievement"

## Database Migration

```sql
-- Add bookmarks table
CREATE TABLE user_article_bookmarks (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

-- Add reads table
CREATE TABLE user_article_reads (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_percentage INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  first_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  marked_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX ON user_article_bookmarks(user_id);
CREATE INDEX ON user_article_bookmarks(article_id);
CREATE INDEX ON user_article_bookmarks(created_at);

CREATE INDEX ON user_article_reads(user_id);
CREATE INDEX ON user_article_reads(article_id);
CREATE INDEX ON user_article_reads(user_id, article_id);
CREATE INDEX ON user_article_reads(is_read);
CREATE INDEX ON user_article_reads(last_read_at);
```

## Future Enhancements

1. **Reading Collections**
   - Group bookmarks into collections
   - Share collections with others
   - Curated reading paths

2. **Social Features**
   - See what friends are reading
   - Article recommendations
   - Discussion threads

3. **Advanced Analytics**
   - Reading habits visualization
   - Time-of-day patterns
   - Topic preferences

4. **Smart Features**
   - Auto-bookmark related articles
   - Resume reading from last position
   - Text-to-speech progress sync
