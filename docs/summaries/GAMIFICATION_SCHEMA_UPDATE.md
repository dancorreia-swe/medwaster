# Gamification Schema Update

## Change Made

Added new mission type to support wiki bookmark feature.

## Updated Mission Types

Added `"bookmark_articles"` to mission types enum.

**Before (8 types):**
```typescript
"complete_questions"
"complete_quiz"
"complete_trail_content"
"read_article"
"login_daily"
"achieve_score"
"spend_time_learning"
"complete_streak"
```

**After (9 types):**
```typescript
"complete_questions"
"complete_quiz"
"complete_trail_content"
"read_article"
"bookmark_articles"      // ← NEW
"login_daily"
"achieve_score"
"spend_time_learning"
"complete_streak"
```

## Why This Change?

Now that users can bookmark wiki articles, we should encourage this behavior through missions.

## Example Missions

```typescript
{
  title: "Bookmark Organizer",
  description: "Bookmark 5 articles for future reference",
  type: "bookmark_articles",
  frequency: "weekly",
  targetValue: 5
}

{
  title: "Curator",
  description: "Bookmark 3 articles today",
  type: "bookmark_articles",
  frequency: "daily",
  targetValue: 3
}

{
  title: "Reading List Builder",
  description: "Create a collection of 10 bookmarked articles",
  type: "bookmark_articles",
  frequency: "monthly",
  targetValue: 10
}
```

## Implementation

When a user bookmarks an article:

```typescript
async function onArticleBookmark(userId: string, articleId: number) {
  // Create bookmark
  await db.userArticleBookmarks.insert({
    userId,
    articleId,
    createdAt: now()
  });
  
  // Update missions
  const missions = await db.userMissions.findMany({
    where: {
      userId,
      assignedDate: today(),
      type: 'bookmark_articles',
      isCompleted: false
    }
  });
  
  for (const mission of missions) {
    const newProgress = mission.currentProgress + 1;
    const isCompleted = newProgress >= mission.targetValue;
    
    await db.userMissions.update({
      where: { id: mission.id },
      data: {
        currentProgress: newProgress,
        isCompleted,
        completedAt: isCompleted ? now() : null
      }
    });
  }
}
```

## Benefits

1. **Encourages Organization**
   - Users build curated reading lists
   - Better content retention

2. **Supports Learning Flow**
   - Bookmark for later when busy
   - Return when ready to focus

3. **Increases Engagement**
   - Additional mission variety
   - Rewards planning ahead

4. **Analytics Opportunity**
   - Track which articles get bookmarked most
   - Identify valuable content

## Database Impact

- No schema changes (just enum value addition)
- Existing missions table supports it
- Type-safe with updated enum

## Notes

- ✅ Backward compatible
- ✅ No migration needed (enum value only)
- ✅ Integrates with existing bookmark system
- ✅ Complements reading missions nicely
