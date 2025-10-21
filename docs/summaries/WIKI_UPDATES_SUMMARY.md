# Wiki Schema Updates - Bookmarks & Reading Progress

## Overview
Added user bookmark and reading progress tracking to the wiki schema.

## Changes Made

### Files Modified
- `/apps/server/src/db/schema/wiki.ts` - Added 2 new tables (now 392 lines, was 285)

### Files Created
- `/docs/wiki-bookmarks-reads.md` - Complete documentation

## New Tables (2)

### 1. `user_article_bookmarks`
Allows users to save/favorite articles for later.

**Fields:**
- `userId` + `articleId` (composite PK)
- `notes` - Optional personal notes
- `createdAt`, `updatedAt`

**Features:**
- Save articles for later
- Add personal annotations
- Create reading lists
- Quick access to favorites

### 2. `user_article_reads`
Tracks reading progress and completion.

**Fields:**
- `userId` + `articleId`
- `isRead` - Manual mark as read flag
- `readPercentage` - Auto-tracked scroll progress (0-100)
- `timeSpentSeconds` - Time spent on article
- `firstReadAt`, `lastReadAt`, `markedReadAt`

**Features:**
- Track which articles read
- Show reading progress
- Calculate time spent
- Suggest unread articles
- Analytics on engagement

## Reading States

```
Not Started: No record exists
In Progress: 0 < readPercentage < 100
Completed:   readPercentage === 100 || isRead === true
```

## Key Features ✅

### Bookmarks
- ⭐ Add/remove bookmarks
- 📝 Personal notes on bookmarks
- 📚 Bookmarks list with notes
- 🔖 Quick bookmark toggle

### Reading Progress
- 📊 Automatic scroll tracking (0-100%)
- ⏱️ Time spent tracking
- ✓ Manual "mark as read"
- 📅 First/last read timestamps
- 🔄 Resume from last position

### Integration
- 🎯 Counts toward daily missions
- 📈 Updates daily activity stats
- 🏆 Triggers mission progress
- 📱 Syncs across devices

## Type Exports (4 new)

```typescript
UserArticleBookmark, NewUserArticleBookmark
UserArticleRead, NewUserArticleRead
```

## Indexes

**Bookmarks:**
- userId (user's bookmarks)
- articleId (bookmark count per article)
- createdAt (chronological order)

**Reads:**
- userId (user's history)
- articleId (read count per article)
- userId + articleId (combined lookup)
- isRead (filter read/unread)
- lastReadAt (recently read)

## API Suggestions

```
Bookmarks:
POST   /api/wiki/articles/:id/bookmark
DELETE /api/wiki/articles/:id/bookmark
PUT    /api/wiki/articles/:id/bookmark/notes
GET    /api/wiki/bookmarks

Reading Progress:
GET    /api/wiki/articles/:id/progress
PUT    /api/wiki/articles/:id/progress
POST   /api/wiki/articles/:id/mark-read
GET    /api/wiki/reading-list        # Unread
GET    /api/wiki/reading-history     # Read
```

## UI Examples

### Article Header
```
[🔖 Bookmark] [✓ Mark as Read]
```

### Progress Indicator
```
Reading Progress: ▓▓▓▓▓▓▓░░░ 65%
```

### Bookmark with Notes
```
⭐ Sharps Disposal Guidelines
   "Important: Check temps" • 3 days ago
```

### Reading List
```
To Read (8)
○ Container Safety (5 min)
○ Waste Segregation (8 min)

Recently Read (24)
✓ Sharps Guidelines • 2 days ago
✓ PPE Requirements • 1 week ago
```

## Auto-Tracking Features

### Scroll Progress
- Updates every 5 seconds while reading
- Tracks percentage of article scrolled
- Saves automatically

### Time Tracking
- Counts active reading time
- Excludes idle time
- Used for analytics

### Smart Completion
- Auto-marks read at 90% + sufficient time
- Manual override available
- Triggers mission completion

## Statistics Available

### Per User
- Total articles read
- Time spent reading
- Average read time
- Bookmarks count
- Articles in progress

### Per Article
- Total views
- Unique readers
- Completion rate
- Average time spent
- Bookmark count

## Integration with Gamification

```typescript
// When article fully read
onArticleComplete(userId, articleId) {
  // Update read status
  markAsRead(userId, articleId);
  
  // Update daily activity
  incrementArticlesRead(userId);
  
  // Update missions
  updateMission(userId, 'read_article');
  
  // Check for achievements
  checkReadingAchievements(userId);
}
```

## Mobile Features

1. **Offline Reading**
   - Download bookmarked articles
   - Sync progress when online

2. **Quick Actions**
   - Swipe to bookmark
   - Long-press to mark read

3. **Smart Lists**
   - Continue reading
   - Recommended for you
   - Popular in category

4. **Notifications**
   - "3 bookmarked articles to read"
   - "New article in your interests"

## Business Logic

### Reading Recommendations
```typescript
// Suggest unread articles in same category
getRecommendations(userId) → unread articles, sorted by popularity
```

### Progress Sync
```typescript
// Auto-save every 5 seconds while reading
saveProgress(userId, articleId, percentage, timeSpent)
```

### Completion Detection
```typescript
if (scrolled >= 90% && timeSpent >= estimatedTime * 0.5) {
  autoMarkAsRead();
}
```

## Database Performance

- Composite indexes for fast lookups
- User-scoped queries optimized
- Date-based filtering efficient
- Scroll updates batched

## Next Steps

1. **Migration**
   ```bash
   drizzle-kit generate:pg
   drizzle-kit push:pg
   ```

2. **Backend Implementation**
   - API endpoints
   - Progress tracking service
   - Bookmark CRUD
   - Analytics queries

3. **Frontend Implementation**
   - Bookmark toggle button
   - Progress bar component
   - Reading list page
   - Scroll tracking hook

4. **Testing**
   - Bookmark operations
   - Progress updates
   - Edge cases (rapid scrolling)
   - Sync conflicts

## Notes

- ✅ Lightweight schema (2 simple tables)
- ✅ Non-blocking updates (async saves)
- ✅ Privacy-conscious (personal bookmarks)
- ✅ Analytics-ready (comprehensive tracking)
- ✅ Mobile-optimized (offline support ready)
- ✅ Integrates with missions/gamification
