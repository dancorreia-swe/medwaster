# Achievement Notification Tracking

## Problem Statement
**Question:** "How can we track achievements that were dispatched but weren't shown to the user?"

**Answer:** We track three states in the `user_achievements` table:
1. **Unlocked** (`unlocked_at`) - Achievement was earned
2. **Notified** (`notified_at`) - Toast notification was shown  
3. **Viewed** (`viewed_at`) - User opened achievements screen

## Database Schema

The `user_achievements` table already has notification tracking fields:

```sql
CREATE TABLE user_achievements (
  user_id TEXT NOT NULL,
  achievement_id INTEGER NOT NULL,
  
  -- Achievement state
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  
  -- Notification tracking (EXISTING FIELDS)
  notified_at TIMESTAMP WITH TIME ZONE,    -- When toast was shown
  viewed_at TIMESTAMP WITH TIME ZONE,      -- When user viewed in achievements screen
  claimed_at TIMESTAMP WITH TIME ZONE,     -- When rewards were collected (future)
  
  -- ... other fields
);
```

## Notification States

### State Flow
```
Achievement Unlocked → Backend sets unlocked_at
         ↓
User opens app → Check for unnotified achievements
         ↓
Toast shown → Frontend calls /mark-notified → Backend sets notified_at
         ↓
User taps toast → Navigate to achievements screen
         ↓
User views achievement → Frontend calls /mark-viewed → Backend sets viewed_at
```

### Query Examples

**Find unnotified achievements:**
```sql
SELECT * FROM user_achievements
WHERE user_id = 'user-123'
  AND is_unlocked = true
  AND notified_at IS NULL;
```

**Find notification delivery rate:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE is_unlocked = true) as total_unlocked,
  COUNT(*) FILTER (WHERE notified_at IS NOT NULL) as notified,
  COUNT(*) FILTER (WHERE viewed_at IS NOT NULL) as viewed,
  ROUND(
    COUNT(*) FILTER (WHERE notified_at IS NOT NULL)::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE is_unlocked = true), 0) * 100, 
    2
  ) as notification_rate
FROM user_achievements
WHERE user_id = 'user-123';
```

## API Endpoints

### 1. Get Unnotified Achievements
**GET** `/achievements/unnotified`

Returns achievements that were unlocked but notification wasn't shown yet.

```typescript
{
  success: true,
  data: [
    {
      userId: "user-123",
      achievementId: 1,
      isUnlocked: true,
      unlockedAt: "2024-11-16T20:00:00Z",
      notifiedAt: null,  // NOT yet notified
      viewedAt: null,
      achievement: {
        id: 1,
        name: "Primeiro Passo",
        // ... other fields
      }
    }
  ]
}
```

### 2. Mark as Notified
**POST** `/achievements/mark-notified/:achievementId`

Called automatically when toast is shown.

```typescript
// Request
POST /achievements/mark-notified/1

// Response
{
  success: true,
  data: { notified: true }
}

// Updates database:
// notified_at = NOW()
```

### 3. Get Notification Stats
**GET** `/achievements/notification-stats`

Analytics about notification delivery.

```typescript
{
  success: true,
  data: {
    totalUnlocked: 5,
    notified: 4,           // 4 were shown to user
    notNotified: 1,        // 1 was missed
    viewed: 3,             // 3 were actually viewed
    claimed: 2,            // 2 had rewards claimed
    notificationRate: 80   // 80% delivery rate
  }
}
```

## Frontend Implementation

### Updated Hook
The `useAchievementNotifications` hook now:

1. **Calls `/unnotified`** instead of `/recent-unlocks`
2. **Marks as notified** after showing toast
3. **No client-side deduplication needed** (DB handles it)

```typescript
// OLD approach (time-based deduplication)
const lastCheckRef = useRef<Date>(new Date());
const shownAchievementsRef = useRef<Set<number>>(new Set());

// NEW approach (DB-based tracking)
const response = await client.achievements.unnotified.get();
unnotified.forEach((ua) => {
  showAchievement(ua.achievement);
  
  // Mark as notified in DB
  await client.achievements["mark-notified"][ua.achievementId].post();
});
```

### Benefits
✅ **Reliable:** No achievements are lost  
✅ **Persistent:** Survives app restarts  
✅ **Auditable:** Can query notification history  
✅ **Debuggable:** Can see exactly what wasn't shown  
✅ **Scalable:** Works across multiple devices  

## Summary

### Before (Time-based tracking)
- ❌ Achievements could be lost on app restart
- ❌ No way to track delivery success
- ❌ Duplicate prevention only in memory
- ❌ No analytics

### After (Database tracking)
- ✅ Achievements never lost
- ✅ Full delivery tracking
- ✅ Persistent deduplication
- ✅ Analytics and monitoring
- ✅ Works across devices
- ✅ Debuggable and auditable

The system now reliably tracks every achievement notification from unlock to delivery, ensuring users never miss their accomplishments! 🎉

## Files Modified/Created

### Backend
- **Created:** `apps/server/src/modules/achievements/notification.service.ts` - Notification tracking service
- **Modified:** `apps/server/src/modules/achievements/index.ts` - Added notification endpoints

### Frontend
- **Modified:** `apps/native/features/achievements/use-achievement-notifications.ts` - Uses unnotified endpoint

### Database
- **Already exists:** `notified_at`, `viewed_at`, `claimed_at` fields in `user_achievements` table
