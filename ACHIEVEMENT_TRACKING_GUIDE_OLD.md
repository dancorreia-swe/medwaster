# Achievement Tracking & Unlocking System

## Overview

The achievement system tracks user actions and automatically unlocks achievements when requirements are met.

## Architecture

```
┌─────────────────┐
│  User Action    │ (Complete trail, read article, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Track Event     │ trackTrailCompleted(userId, trailId, score, perfect)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Achievement     │ Process event, evaluate achievements
│ Engine          │
└────────┬────────┘
         │
         ├──► Update progress in user_achievements table
         ├──► Check if achievement unlocked
         └──► Record in achievement_history
                │
                ▼
         ┌─────────────────┐
         │ Notification    │ (TODO: Push notification to mobile)
         └─────────────────┘
```

## How It Works

### 1. Event Tracking

When a user performs an action, track it using the helper functions:

```typescript
import {
  trackTrailCompleted,
  trackArticleRead,
  trackQuestionAnswered,
} from "@/modules/achievements/trackers";

// Example: User completes a trail
await trackTrailCompleted(userId, trailId, score, isPerfect);

// Example: User reads an article
await trackArticleRead(userId, articleId, categoryId);
```

### 2. Event Processing

The `AchievementEngine` automatically:
- Finds relevant achievements for the event type
- Evaluates if the user has met the conditions
- Updates progress in `user_achievements` table
- Unlocks achievement if conditions are met
- Records unlock in `achievement_history`

### 3. Data Flow

```
Event → achievement_events table (logged)
  ↓
Engine processes event
  ↓
Updates user_achievements (progress)
  ↓
If unlocked → achievement_history (record)
  ↓
TODO: Push notification to mobile app
```

## Integration Points

### Trails Module

**File:** `apps/server/src/modules/trails/progress.service.ts`

```typescript
import { trackTrailCompleted } from "@/modules/achievements/trackers";

// When marking trail as completed
static async completeTrail(userId: string, trailId: string) {
  // ... existing trail completion logic

  // Track achievement
  const isPerfect = score === totalQuestions; // or your perfect score logic
  await trackTrailCompleted(userId, trailId, score, isPerfect);
}
```

### Wiki Module

**File:** `apps/server/src/modules/wiki/index.ts` (article read endpoint)

```typescript
import { trackArticleRead } from "@/modules/achievements/trackers";

// When marking article as read
app.post("/articles/:id/read", async ({ user, params }) => {
  // ... existing article read logic

  // Track achievement
  await trackArticleRead(user!.id, params.id, article.categoryId);
});
```

### Questions Module

**File:** `apps/server/src/modules/questions/index.ts`

```typescript
import { trackQuestionAnswered } from "@/modules/achievements/trackers";

// When submitting answer
app.post("/questions/:id/answer", async ({ user, body }) => {
  // ... existing answer logic

  // Track achievement
  await trackQuestionAnswered(user!.id, questionId, isCorrect);
});
```

### Quizzes Module

**File:** `apps/server/src/modules/quizzes/index.ts`

```typescript
import { trackQuizCompleted } from "@/modules/achievements/trackers";

// When completing quiz
app.post("/quizzes/:id/complete", async ({ user, body }) => {
  // ... existing quiz completion logic

  // Track achievement
  await trackQuizCompleted(user!.id, quizId, score, totalQuestions);
});
```

### Certificates Module

**File:** `apps/server/src/modules/certificates/index.ts`

```typescript
import { trackCertificateEarned } from "@/modules/achievements/trackers";

// When awarding certificate
app.post("/certificates/award", async ({ user, body }) => {
  // ... existing certificate logic

  // Track achievement
  await trackCertificateEarned(user!.id, certificateId, score);
});
```

### Gamification - Login Streaks

**File:** `apps/server/src/modules/gamification/streaks.service.ts`

```typescript
import { trackLoginStreak } from "@/modules/achievements/trackers";

// When updating streak
static async updateStreak(userId: string) {
  // ... existing streak logic

  // Track achievement for milestones (7, 30 days)
  if (newStreak === 7 || newStreak === 30) {
    await trackLoginStreak(userId, newStreak);
  }
}
```

## Mobile App Integration

### API Endpoints

The mobile app can use these endpoints:

#### 1. Get All Achievements

```typescript
GET /achievements
```

Returns all active, public achievements with their requirements.

#### 2. Get User Progress

```typescript
GET /achievements/my-progress
```

Returns user's progress on all achievements including:
- `currentValue`: Current progress
- `targetValue`: Target to unlock
- `progressPercentage`: 0-100%
- `isUnlocked`: true/false
- `unlockedAt`: Timestamp when unlocked

#### 3. Get Recent Unlocks

```typescript
GET /achievements/recent-unlocks?limit=5
```

Returns recently unlocked achievements for showing notifications.

### Real-time Notifications (TODO)

When an achievement is unlocked:
1. Backend records in `achievement_history`
2. Sends push notification to mobile device
3. Mobile app shows celebration UI
4. User can view in achievements screen

Possible implementations:
- **Push Notifications**: FCM/APNS
- **WebSockets**: Real-time connection
- **Polling**: Periodic checks for new unlocks

## Database Tables

### `user_achievements`
Tracks user progress on each achievement:
- `userId`, `achievementId`
- `currentValue`, `targetValue`, `progressPercentage`
- `isUnlocked`, `unlockedAt`

### `achievement_events`
Logs all trackable events:
- `userId`, `eventType`, `eventData`
- `processed`, `achievementsUnlocked`

### `achievement_history`
Records unlocked achievements:
- `userId`, `achievementId`, `unlockedAt`
- `triggerEvent`, `rewardsGranted`

## Testing

1. **Seed achievements**: `bun run db:seed`
2. **Perform action**: Complete a trail
3. **Check progress**: Query `user_achievements` table
4. **Verify unlock**: Check `achievement_history` table

## Event Types Reference

| Event Type | Trigger Function | Use When |
|------------|-----------------|----------|
| `first_login` | `trackFirstLogin(userId)` | User's first login ever |
| `onboarding_complete` | `trackOnboardingComplete(userId)` | User finishes onboarding |
| `login_streak` | `trackLoginStreak(userId, days)` | Login streak milestone |
| `trail_completed` | `trackTrailCompleted(...)` | User completes a trail |
| `article_read` | `trackArticleRead(...)` | User reads an article |
| `question_answered` | `trackQuestionAnswered(...)` | User answers a question |
| `quiz_completed` | `trackQuizCompleted(...)` | User completes a quiz |
| `certificate_earned` | `trackCertificateEarned(...)` | User earns certificate |
| `bookmark_created` | `trackBookmarkCreated(...)` | User bookmarks article |

## Next Steps

1. ✅ Achievement seed created
2. ✅ Achievement engine built
3. ✅ API endpoints added
4. ⏳ Integrate tracking in modules (trails, wiki, questions, etc.)
5. ⏳ Add push notifications for unlocks
6. ⏳ Show progress in mobile app
7. ⏳ Add celebration UI for unlocks
