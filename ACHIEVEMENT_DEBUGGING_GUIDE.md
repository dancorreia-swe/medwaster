# Achievement Tracking Debugging Guide

## Issue
Completed a trail, answered a question, and read an article but achievements weren't unlocked.

## Fix Applied

### Added Missing Question Tracking
**File:** `apps/server/src/modules/trails/progress.service.ts`

**Change:** Added `trackQuestionAnswered()` call after recording question attempt

```typescript
// Line 24: Import the tracker
import { trackTrailCompleted, trackArticleRead, trackQuestionAnswered } from "../achievements/trackers";

// Line 573: After recording attempt, track achievement
await db.insert(userQuestionAttempts).values({
  userId,
  questionId,
  trailContentId: content.id,
  isCorrect,
  userAnswer: JSON.stringify(answer.answer),
  timeSpentSeconds: answer.timeSpentSeconds || 0,
});

// Track achievement for answering question
await trackQuestionAnswered(userId, questionId, isCorrect);
```

## Existing Tracking (Already Working)

### Trail Completion ✅
**Location:** `apps/server/src/modules/trails/progress.service.ts:1158`
```typescript
await trackTrailCompleted(userId, trailId.toString(), score, isPerfect);
```

### Article Read ✅
**Location:** `apps/server/src/modules/trails/progress.service.ts:995`
```typescript
await trackArticleRead(userId, content.articleId?.toString() || "", undefined);
```

## Achievements That Should Unlock

### Trail Achievements
1. **Explorador Iniciante** - Complete 1 trail (50 points)
2. **Trilheiro** - Complete 5 trails (250 points)
3. **Mestre das Trilhas** - Complete 10 trails (500 points)

### Article Achievements
1. **Leitor Curioso** - Read 1 article (25 points)
2. **Leitor Assíduo** - Read 10 articles (100 points)
3. **Biblioteca Vivente** - Read 50 articles (500 points)

### Question Achievements
1. **Primeiro Passo nos Estudos** - Answer 1 question (25 points)
2. **Estudante Dedicado** - Answer 50 questions (200 points)

## How to Debug

### 1. Check Server Logs
Look for these console logs when completing actions:

```bash
# When achievement is tracked:
🎯 Tracking achievement event: trail_completed for user [user-id]
🎯 Tracking achievement event: article_read for user [user-id]
🎯 Tracking achievement event: question_answered for user [user-id]

# When achievement is processed:
✓ Processed event: 1 evaluated, 1 progressed, 1 unlocked

# When achievement is unlocked:
🎉 Unlocking achievement: [achievement-name] for user [user-id]
```

### 2. Check Database

**Check if events were recorded:**
```sql
SELECT * FROM achievement_events 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Check if achievements were unlocked:**
```sql
SELECT 
  ua.*,
  a.name,
  a.slug
FROM user_achievements ua
JOIN achievements a ON a.id = ua.achievement_id
WHERE ua.user_id = 'your-user-id'
  AND ua.is_unlocked = true
ORDER BY ua.unlocked_at DESC;
```

**Check achievement progress:**
```sql
SELECT 
  ua.*,
  a.name,
  a.slug,
  a.trigger_config
FROM user_achievements ua
JOIN achievements a ON a.id = ua.achievement_id
WHERE ua.user_id = 'your-user-id'
ORDER BY ua.progress_percentage DESC;
```

### 3. Manual Test

**Test trail completion:**
```bash
# Complete a trail through the app
# Check server logs for:
# - "🎯 Tracking achievement event: trail_completed"
# - "🎉 Unlocking achievement: Explorador Iniciante"
```

**Test article read:**
```bash
# Read an article through the app
# Check server logs for:
# - "🎯 Tracking achievement event: article_read"
# - "🎉 Unlocking achievement: Leitor Curioso"
```

**Test question answered:**
```bash
# Answer a question through the app
# Check server logs for:
# - "🎯 Tracking achievement event: question_answered"
# - "🎉 Unlocking achievement: Primeiro Passo nos Estudos"
```

## Common Issues

### Issue 1: Events Recorded but Not Processed
**Symptom:** `achievement_events` table has records but `processed = false`

**Solution:** Check if achievement engine is running. Events should be processed immediately after creation.

### Issue 2: Events Processed but Achievement Not Unlocked
**Symptom:** Events show `processed = true` but `achievements_unlocked = []`

**Possible causes:**
1. Achievement doesn't exist in database
2. Achievement is not "active" or "public"
3. Trigger config doesn't match event type
4. Count hasn't reached target (check `current_value` vs `target_value`)

**Check:**
```sql
-- Verify achievement exists and is active
SELECT * FROM achievements 
WHERE slug = 'first-trail' 
  AND status = 'active' 
  AND visibility = 'public';

-- Check user progress
SELECT * FROM user_achievements
WHERE user_id = 'your-user-id'
  AND achievement_id = [achievement-id];
```

### Issue 3: Achievement Unlocked but Not Shown
**Symptom:** `user_achievements` shows `is_unlocked = true` but no notification

**Solution:** Check notification tracking:
```sql
SELECT 
  is_unlocked,
  unlocked_at,
  notified_at,
  viewed_at
FROM user_achievements
WHERE user_id = 'your-user-id'
  AND achievement_id = [achievement-id];
```

If `notified_at` is NULL, the mobile app should show it on next launch.

## Quick Fix Checklist

- [x] Import `trackQuestionAnswered` in progress.service.ts
- [x] Call `trackQuestionAnswered` after recording question attempt
- [ ] Restart server to apply changes
- [ ] Clear app data / reinstall app
- [ ] Try completing actions again
- [ ] Check server logs
- [ ] Check database for event records
- [ ] Check mobile app for toast notifications

## Testing Steps

1. **Restart the server**
   ```bash
   bun run dev:server
   ```

2. **Complete a question**
   - Answer any question in a trail
   - Check server logs for tracking event
   - Check database for achievement unlock

3. **Check notification**
   - Open mobile app
   - Should see toast: "🏆 CONQUISTA DESBLOQUEADA! Primeiro Passo nos Estudos"
   - Navigate to achievements screen
   - Should see achievement unlocked

## Expected Behavior

### After Completing 1 Trail
- ✅ Event: `trail_completed` recorded
- ✅ Achievement: "Explorador Iniciante" unlocked
- ✅ Notification: Toast shown on app
- ✅ Points: +50 points awarded

### After Reading 1 Article
- ✅ Event: `article_read` recorded
- ✅ Achievement: "Leitor Curioso" unlocked
- ✅ Notification: Toast shown on app
- ✅ Points: +25 points awarded

### After Answering 1 Question
- ✅ Event: `question_answered` recorded (NOW FIXED)
- ✅ Achievement: "Primeiro Passo nos Estudos" unlocked
- ✅ Notification: Toast shown on app
- ✅ Points: +25 points awarded

## Next Steps

1. Restart server
2. Try the actions again
3. If still not working, share:
   - Server logs
   - Database query results
   - User ID for debugging
