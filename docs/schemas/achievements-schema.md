# Achievements System Schema Documentation

Complete achievements/conquistas system for MedWaster Learning based on INSTRUCTIONS.md requirements.

## Overview

The achievements system gamifies learning through milestone-based rewards. Different from streak milestones (which are time-based), achievements are **event-driven** and track specific accomplishments across the platform.

## Core Tables

### 1. `achievements`

Defines all possible achievements in the system (admin-created).

**Key Fields:**
- `name`: Unique achievement name (max 80 chars, motivational)
- `description`: User-facing explanation (max 200 chars)
- `category`: Type of achievement (trails, wiki, questions, etc.)
- `difficulty`: Easy, medium, or hard
- `status`: Active, inactive, or archived
- `triggerType`: What event unlocks this achievement
- `triggerConfig`: JSONB configuration for the trigger
- `badgeImageUrl` / `badgeSvg`: Visual representation
- `customMessage`: Optional message shown when unlocked
- `displayOrder`: Sorting order in UI
- `isSecret`: Hidden until unlocked
- `obtainedCount` / `obtainedPercentage`: Analytics

**Categories:**
```typescript
- trails        // Trail completion achievements
- wiki          // Reading achievements  
- questions     // Question/quiz achievements
- certification // Certificate achievements
- engagement    // Login streaks, AI usage
- general       // Onboarding, first actions
```

**Difficulty Levels:**
```typescript
- easy    // 1 star - Quick wins (e.g., "Complete first trail")
- medium  // 2 stars - Moderate effort (e.g., "Complete 5 trails")
- hard    // 3 stars - Major milestone (e.g., "Complete all trails perfectly")
```

### 2. `userAchievements`

Tracks each user's progress toward and completion of achievements.

**Key Fields:**
- `userId` + `achievementId`: Composite primary key
- `progress`: Current progress value (e.g., 3 out of 5 trails)
- `progressMax`: Target value (e.g., 5)
- `isUnlocked`: Achievement obtained flag
- `unlockedAt`: When achievement was earned
- `triggerData`: JSONB with event data that triggered unlock
- `notifiedAt`: When user was notified
- `viewedAt`: When user viewed the notification

**States:**
```typescript
Not Started: No record exists
In Progress: 0 < progress < progressMax
Unlocked:    isUnlocked === true
```

### 3. `achievementEvents`

Event log for achievement system debugging and analytics.

**Key Fields:**
- `userId`: User who triggered event
- `eventType`: Type of event (trail_complete, article_read, etc.)
- `eventData`: JSONB with event details
- `achievementsTriggered`: How many achievements checked
- `achievementsUnlocked`: JSON array of achievement IDs unlocked
- `createdAt`: Event timestamp

**Purpose:**
- Audit trail of achievement processing
- Debug why achievements didn't unlock
- Analytics on achievement unlock patterns
- Performance monitoring

## Trigger Types (21 total)

### Trail Achievements
```typescript
"complete_trails"           // Complete X trails
"complete_specific_trail"   // Complete a specific trail
"complete_trails_perfect"   // Complete trails with 100% score
"complete_trails_sequence"  // Complete trails without breaks
```

**Trigger Config Examples:**
```json
{
  "count": 5,              // For "complete_trails"
  "trailId": 42,          // For "complete_specific_trail"
  "minScore": 100,        // For "complete_trails_perfect"
  "sequenceLength": 3     // For "complete_trails_sequence"
}
```

### Wiki Achievements
```typescript
"read_category_complete"   // Read all articles in a category
"read_articles_count"      // Read X articles
"read_time_total"          // Spend X minutes reading
"read_specific_article"    // Read an important article
"bookmark_articles_count"  // Bookmark X articles
```

**Trigger Config Examples:**
```json
{
  "categoryId": 5,        // For "read_category_complete"
  "count": 25,           // For "read_articles_count"
  "minutes": 300,        // For "read_time_total" (5 hours)
  "articleId": 10        // For "read_specific_article"
}
```

### Question/Quiz Achievements
```typescript
"question_streak_correct"    // X correct answers in a row
"questions_answered_count"   // Answer X questions total
"question_accuracy_rate"     // Achieve X% accuracy
"answer_hard_question"       // Correctly answer advanced question
"complete_quiz_count"        // Complete X quizzes
```

**Trigger Config Examples:**
```json
{
  "streakLength": 10,     // For "question_streak_correct"
  "count": 100,          // For "questions_answered_count"
  "accuracyPercent": 90, // For "question_accuracy_rate"
  "difficulty": "advanced" // For "answer_hard_question"
}
```

### Certification Achievements
```typescript
"first_certificate"          // Obtain first certificate
"certificate_high_score"     // Get certificate with high score
"certificate_fast_approval"  // Certificate approved quickly
```

### Engagement Achievements
```typescript
"onboarding_complete"   // Finish onboarding
"first_login"          // Welcome achievement
"login_streak"         // Login X consecutive days
"use_ai_assistant"     // First AI interaction
```

### Manual Achievements
```typescript
"manual"  // Admin-triggered only
```

## Business Logic

### Achievement Check Flow

```typescript
async function checkAchievements(userId: string, eventType: string, eventData: any) {
  // Log the event
  const event = await db.achievementEvents.create({
    userId,
    eventType,
    eventData
  });
  
  // Get all active achievements for this event type
  const relevantAchievements = await db.achievements.findMany({
    where: {
      status: 'active',
      triggerType: eventType
    }
  });
  
  let unlockedIds = [];
  
  for (const achievement of relevantAchievements) {
    // Get or create user progress
    const userAchievement = await db.userAchievements.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      create: { userId, achievementId: achievement.id, progress: 0 },
      update: {}
    });
    
    // Skip if already unlocked
    if (userAchievement.isUnlocked) continue;
    
    // Update progress based on trigger type
    const newProgress = calculateProgress(achievement, userAchievement, eventData);
    
    // Check if unlocked
    if (newProgress >= achievement.triggerConfig.target) {
      await unlockAchievement(userId, achievement.id, eventData);
      unlockedIds.push(achievement.id);
    } else {
      await updateProgress(userId, achievement.id, newProgress);
    }
  }
  
  // Update event log
  await db.achievementEvents.update({
    where: { id: event.id },
    data: {
      achievementsTriggered: relevantAchievements.length,
      achievementsUnlocked: JSON.stringify(unlockedIds)
    }
  });
  
  return unlockedIds;
}
```

### Example: Trail Completion

```typescript
async function onTrailComplete(userId: string, trailId: number, score: number) {
  // Check achievements
  const unlocked = await checkAchievements(userId, 'trail_complete', {
    trailId,
    score,
    isPerfect: score === 100
  });
  
  // If any unlocked, notify user
  if (unlocked.length > 0) {
    await notifyAchievements(userId, unlocked);
  }
}
```

### Progress Calculation Examples

```typescript
// Complete X trails
if (achievement.triggerType === 'complete_trails') {
  const completed = await countCompletedTrails(userId);
  return completed; // progress = 3, progressMax = 5
}

// Read X articles
if (achievement.triggerType === 'read_articles_count') {
  const read = await countReadArticles(userId);
  return read;
}

// Login streak
if (achievement.triggerType === 'login_streak') {
  const streak = await getCurrentStreak(userId);
  return streak;
}
```

## Integration Points

### With Trails System
```typescript
// When trail completed
onTrailComplete(userId, trailId, score) →
  checkAchievements(userId, 'trail_complete', { trailId, score })
  
// Possible achievements triggered:
- complete_trails (count increments)
- complete_specific_trail (if matches)
- complete_trails_perfect (if score === 100)
```

### With Wiki System
```typescript
// When article read
onArticleRead(userId, articleId, categoryId) →
  checkAchievements(userId, 'article_read', { articleId, categoryId })
  
// When article bookmarked
onArticleBookmark(userId, articleId) →
  checkAchievements(userId, 'article_bookmark', { articleId })
```

### With Questions System
```typescript
// When question answered
onQuestionAnswer(userId, questionId, isCorrect) →
  checkAchievements(userId, 'question_answer', { questionId, isCorrect })
  
// Update streak
if (isCorrect) incrementStreak(); else resetStreak();
```

### With Gamification System
```typescript
// Login streak milestone → achievement
onStreakMilestone(userId, days) →
  checkAchievements(userId, 'login_streak', { days })
```

## UI Components

### Achievement Card (Locked)
```
┌─────────────────────────────┐
│ 🔒 ???                      │
│                             │
│ Complete 5 trails           │
│ Progress: ▓▓▓░░ 3/5        │
└─────────────────────────────┘
```

### Achievement Card (Unlocked)
```
┌─────────────────────────────┐
│ ⭐ Trail Explorer           │
│                             │
│ Complete 5 trails           │
│ Unlocked: Jan 15, 2025     │
│ ⭐⭐ Medium                 │
└─────────────────────────────┘
```

### Achievement Notification
```
┌─────────────────────────────┐
│ 🎉 Achievement Unlocked!    │
│                             │
│ ⭐ Trail Explorer           │
│ You completed 5 trails!     │
│                             │
│ [View Details]              │
└─────────────────────────────┘
```

### Achievements Grid
```
My Achievements (12/45)

Unlocked (12)                In Progress (8)
┌────┐ ┌────┐ ┌────┐        ┌────┐ 
│ ⭐ │ │ ⭐ │ │ ⭐ │        │ 🔒 │ 3/5
└────┘ └────┘ └────┘        └────┘

                             Locked (25)
                             ┌────┐
                             │ ❓ │
                             └────┘
```

### Progress View
```
Trail Explorer
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Complete 5 trails

Progress: ▓▓▓░░ 60% (3/5)

Recent progress:
✓ Medical Waste 101 - 2 days ago
✓ Sharps Safety - 5 days ago  
✓ PPE Basics - 1 week ago

Next: Complete 2 more trails
```

## Example Achievements

### Easy (Quick Wins)
```json
{
  "name": "First Steps",
  "description": "Complete your first trail",
  "category": "trails",
  "difficulty": "easy",
  "triggerType": "complete_trails",
  "triggerConfig": { "count": 1 }
}

{
  "name": "Curious Reader",
  "description": "Read your first article",
  "category": "wiki",
  "difficulty": "easy",
  "triggerType": "read_articles_count",
  "triggerConfig": { "count": 1 }
}

{
  "name": "Welcome Aboard",
  "description": "Complete onboarding",
  "category": "general",
  "difficulty": "easy",
  "triggerType": "onboarding_complete",
  "triggerConfig": {}
}
```

### Medium (Consistent Effort)
```json
{
  "name": "Trail Explorer",
  "description": "Complete 5 learning trails",
  "category": "trails",
  "difficulty": "medium",
  "triggerType": "complete_trails",
  "triggerConfig": { "count": 5 }
}

{
  "name": "Bookworm",
  "description": "Read 25 articles",
  "category": "wiki",
  "difficulty": "medium",
  "triggerType": "read_articles_count",
  "triggerConfig": { "count": 25 }
}

{
  "name": "Sharp Shooter",
  "description": "Get 10 answers correct in a row",
  "category": "questions",
  "difficulty": "medium",
  "triggerType": "question_streak_correct",
  "triggerConfig": { "streakLength": 10 }
}
```

### Hard (Major Milestones)
```json
{
  "name": "Perfectionist",
  "description": "Complete 5 trails with 100% score",
  "category": "trails",
  "difficulty": "hard",
  "triggerType": "complete_trails_perfect",
  "triggerConfig": { "count": 5, "minScore": 100 }
}

{
  "name": "Knowledge Seeker",
  "description": "Read all articles in every category",
  "category": "wiki",
  "difficulty": "hard",
  "triggerType": "read_category_complete",
  "triggerConfig": { "allCategories": true }
}

{
  "name": "Master Certified",
  "description": "Earn certificate with 95%+ average",
  "category": "certification",
  "difficulty": "hard",
  "triggerType": "certificate_high_score",
  "triggerConfig": { "minScore": 95 }
}
```

## API Endpoints (Suggested)

```typescript
// Get user's achievements
GET /api/achievements
Response: {
  unlocked: Achievement[],
  inProgress: Achievement[] with progress,
  locked: Achievement[] (if not secret)
}

// Get specific achievement progress
GET /api/achievements/:id/progress
Response: {
  achievement: Achievement,
  progress: number,
  progressMax: number,
  isUnlocked: boolean,
  unlockedAt?: timestamp
}

// Get achievements by category
GET /api/achievements/category/:category

// Admin: Create achievement
POST /api/admin/achievements
Body: NewAchievement

// Admin: Manually grant achievement
POST /api/admin/achievements/:id/grant
Body: { userId: string, reason: string }

// Admin: View users with achievement
GET /api/admin/achievements/:id/users

// Admin: Achievement analytics
GET /api/admin/achievements/:id/analytics
Response: {
  obtainedCount: number,
  obtainedPercentage: number,
  averageTimeToUnlock: number,
  unlockTimeline: { date, count }[]
}
```

## Indexes & Performance

All tables have comprehensive indexes:
- User lookups (userId)
- Achievement filtering (category, difficulty, status)
- Progress tracking (userId + progress)
- Unlock history (isUnlocked + unlockedAt)
- Event logging (eventType, createdAt)

## Secret Achievements

```typescript
// Hidden until unlocked
{
  "name": "Easter Egg",
  "description": "Found the hidden article!",
  "isSecret": true,  // ← Hides from UI until unlocked
  "triggerType": "read_specific_article",
  "triggerConfig": { "articleId": 999 }
}
```

## Analytics Queries

```sql
-- Most obtained achievements
SELECT name, obtained_count, obtained_percentage
FROM achievements
WHERE status = 'active'
ORDER BY obtained_count DESC
LIMIT 10;

-- Hardest achievements (lowest completion rate)
SELECT name, difficulty, obtained_percentage
FROM achievements
WHERE status = 'active'
ORDER BY obtained_percentage ASC
LIMIT 10;

-- User's achievement progress
SELECT 
  a.name,
  a.difficulty,
  ua.progress,
  ua.progress_max,
  ua.is_unlocked
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = ?
ORDER BY ua.is_unlocked DESC, a.difficulty ASC;

-- Recent unlocks
SELECT u.name as user_name, a.name as achievement_name, ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
JOIN user u ON ua.user_id = u.id
WHERE ua.is_unlocked = true
ORDER BY ua.unlocked_at DESC
LIMIT 20;
```

## Notes & Recommendations

### ✅ What's Great

1. **Flexible Trigger System**
   - 21 trigger types cover all major actions
   - JSONB config allows customization
   - Easy to add new trigger types

2. **Progress Tracking**
   - Users see progress bars
   - Motivates completion
   - Clear goals

3. **Secret Achievements**
   - Easter eggs for exploration
   - Surprise and delight
   - Discovery mechanic

4. **Event Logging**
   - Debug achievement issues
   - Analytics on unlock patterns
   - Performance monitoring

5. **Categories & Difficulty**
   - Organized UI
   - Balanced progression
   - Clear expectations

### 💡 My Input & Suggestions

1. **Consider Adding:**
   - `rarity` field (common, rare, epic, legendary)
   - `prerequisiteAchievements` (unlock chains)
   - `seasonalStartDate` / `seasonalEndDate` (limited time)
   - `shareableText` for social media

2. **Trigger Config Structure:**
   ```typescript
   // Standardize trigger configs
   interface TriggerConfig {
     target?: number;        // Generic target value
     specificId?: number;    // Specific item ID
     percentage?: number;    // Percentage thresholds
     timeframe?: string;     // Optional time constraint
   }
   ```

3. **Notification Strategy:**
   - Batch notifications if multiple unlocked
   - Celebration animation for hard achievements
   - Push notifications for secret unlocks

4. **Balance Recommendations:**
   - Easy: ~80% users should get (onboarding, first actions)
   - Medium: ~30% users (consistent engagement)
   - Hard: ~5% users (dedication)

5. **Future Enhancements:**
   - Achievement chains (one unlocks next)
   - Limited-time seasonal achievements
   - Team/collaborative achievements
   - Achievement leaderboards
