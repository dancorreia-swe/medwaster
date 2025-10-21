# Bookmark/Favorite System Refactor

## Overview
Refactored the bookmark system to be a simple favorite/like system instead of a literal bookmark with notes.

## Changes Made

### 1. Database Schema (`apps/server/src/db/schema/wiki.ts`)
- **Removed** `notes` field from `userArticleBookmarks` table
- **Removed** `updatedAt` field (not needed for simple favorites)
- **Kept** `createdAt` to track when article was favorited

**Before:**
```typescript
notes: text("notes"),
updatedAt: timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow(),
```

**After:**
```typescript
// Simple favorite system - just userId, articleId, and createdAt
```

### 2. Service Layer (`apps/server/src/modules/wiki/services/article-service.ts`)
- **Removed** `updateBookmarkNotes()` method
- **Updated** `addBookmark()` to not accept notes parameter
- **Updated** `getUserBookmarks()` to return `favoritedAt` instead of `bookmark.notes`

### 3. API Routes (`apps/server/src/modules/wiki/articles.ts`)
- **Removed** `PUT /:id/bookmark/notes` endpoint
- **Updated** `POST /:id/bookmark` to not accept notes in body
- **Updated** OpenAPI documentation:
  - "Bookmark" → "Favorite"
  - "bookmarks" → "favorites" in descriptions

## API Changes

### Endpoints Updated

#### POST /articles/:id/bookmark
- **Summary:** "Favorite article"
- **Description:** "Add an article to your favorites for quick access."
- **Body:** None (previously accepted optional notes)

#### DELETE /articles/:id/bookmark
- **Summary:** "Unfavorite article"
- **Description:** "Remove an article from your favorites."

#### GET /articles/bookmarks (REMOVED)
#### PUT /articles/:id/bookmark/notes (REMOVED)

#### GET /articles/bookmarks
- **Summary:** "Get favorites"
- **Description:** "Retrieve all your favorited articles."
- **Response:** Returns `favoritedAt` timestamp instead of notes

## Migration Needed

To apply these schema changes to the database, you'll need to create a migration:

```sql
-- Drop the columns from user_article_bookmarks
ALTER TABLE user_article_bookmarks DROP COLUMN notes;
ALTER TABLE user_article_bookmarks DROP COLUMN updated_at;
```

## Benefits

1. **Simpler UX**: Users just favorite articles they like, no complex note-taking
2. **Cleaner Schema**: Removed unnecessary fields
3. **Better Performance**: Smaller table, fewer writes
4. **Clearer Intent**: "Favorites" vs "Bookmarks with notes"

## Notes

- Reading progress tracking is still available through `userArticleReads` table
- Users can still track their reading history and time spent on articles
- The favorite system is now purely for quick access to preferred articles
