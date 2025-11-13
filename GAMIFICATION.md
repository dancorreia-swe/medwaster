# Gamification System - Implementation Guide

## 📚 Overview

This gamification system adds **streaks**, **daily missions**, and **activity tracking** to the Medwaster platform. It's fully functional on both backend and native app.

---

## 🎯 Features Implemented

### ✅ Backend (Server)

#### **1. Streaks System**
- Track daily user activity
- Current & longest streak tracking
- Freeze system to protect streaks
- Automatic streak breaking for inactive users
- Streak milestones with rewards

**Location:** `apps/server/src/modules/gamification/streaks.service.ts`

#### **2. Daily Activities**
- Record user activities (questions, quizzes, articles, trails)
- Track time spent learning
- Weekly and monthly aggregations
- Automatic mission progress updates

**Location:** `apps/server/src/modules/gamification/daily-activities.service.ts`

#### **3. Missions**
- Daily, weekly, and monthly missions
- Multiple mission types:
  - `complete_questions` - Answer X questions
  - `complete_quiz` - Complete X quizzes
  - `read_article` - Read X articles
  - `complete_trail_content` - Complete X trail items
  - `bookmark_articles` - Bookmark X articles
  - `login_daily` - Just login
  - `achieve_score` - Get X points on a quiz
  - `spend_time_learning` - Spend X minutes learning
  - `complete_streak` - Maintain streak for X days

**Location:** `apps/server/src/modules/gamification/missions.service.ts`

#### **4. Background Workers**
- **Midnight (00:00):** Assign daily/weekly/monthly missions
- **1 AM (01:00):** Check and break inactive streaks

**Location:** `apps/server/src/workers/gamification.worker.ts`

#### **5. API Endpoints**

**User Endpoints:**
```
GET  /gamification/streak              # Get user's streak
POST /gamification/streak/freeze       # Use a freeze
GET  /gamification/streak/milestones   # Get achieved milestones
GET  /gamification/missions            # Get active missions
GET  /gamification/activity/today      # Get today's activity
GET  /gamification/activity/weekly     # Get 7-day stats
GET  /gamification/activity/history    # Get activity history
POST /gamification/activity/record     # Record an activity
```

**Admin Endpoints:**
```
GET    /admin/gamification/missions          # List all missions
POST   /admin/gamification/missions          # Create mission
PATCH  /admin/gamification/missions/:id      # Update mission
DELETE /admin/gamification/missions/:id      # Delete mission
POST   /admin/gamification/assign-missions   # Manual trigger
POST   /admin/gamification/check-streaks     # Manual trigger
```

---

### ✅ Frontend (Native App)

#### **1. API Hooks**
Location: `apps/native/features/gamification/hooks.ts`

```typescript
// Streak hooks
useUserStreak()           // Get user's streak data
useStreakMilestones()     // Get achieved milestones
useUseStreakFreeze()      // Use a freeze (mutation)

// Mission hooks
useUserMissions()         // Get active missions (daily/weekly/monthly)

// Activity hooks
useTodayActivity()        // Get today's activity stats
useWeeklyStats()          // Get 7-day aggregated stats
useActivityHistory(days)  // Get activity history
useRecordActivity()       // Record an activity (mutation)
```

#### **2. Components**

**StatsCard** - `apps/native/features/home/components/stats-card.tsx`
- Displays current streak with flame icon
- Shows weekly stats (questions, articles, trails)
- Clickable streak section → navigates to `/streak`
- "Daily Mission" button → navigates to `/missions`

**MissionCard** - `apps/native/features/gamification/components/mission-card.tsx`
- Displays individual mission with progress bar
- Shows completion status
- Visual feedback for completed missions

**StreakInfoCard** - `apps/native/features/gamification/components/streak-info-card.tsx`
- Displays current streak with visual appeal
- Shows longest streak and available freezes
- Displays next milestone with progress
- "Use Freeze" button

#### **3. Screens**

**Missions Screen** - `apps/native/app/(app)/missions/index.tsx`
- Tabs for Daily, Weekly, Monthly missions
- Progress overview
- Mission cards with completion tracking

**Streak Screen** - `apps/native/app/(app)/streak/index.tsx`
- Detailed streak information
- Freeze management
- Milestone achievements display

---

## 🔧 How to Integrate Activity Tracking

### **Recording Activities**

Whenever a user completes an activity (question, quiz, article, or trail), call the `recordActivity` API:

#### **Example 1: Record Question Completion**

```typescript
import { useRecordActivity } from '@/features/gamification/hooks';

function QuestionScreen() {
  const recordActivity = useRecordActivity();

  const handleQuestionComplete = (questionId: number) => {
    // ... your existing logic

    // Record the activity
    recordActivity.mutate({
      type: 'question',
      metadata: {
        questionId,
      },
    });
  };

  // ...
}
```

#### **Example 2: Record Quiz Completion**

```typescript
import { useRecordActivity } from '@/features/gamification/hooks';

function QuizScreen() {
  const recordActivity = useRecordActivity();

  const handleQuizComplete = (quizId: number, score: number, timeSpent: number) => {
    // ... your existing logic

    // Record the activity
    recordActivity.mutate({
      type: 'quiz',
      metadata: {
        quizId,
        score,
        timeSpentMinutes: timeSpent,
      },
    });
  };

  // ...
}
```

#### **Example 3: Record Article Read**

```typescript
import { useRecordActivity } from '@/features/gamification/hooks';

function ArticleScreen() {
  const recordActivity = useRecordActivity();

  const handleArticleRead = (articleId: number, timeSpent: number) => {
    // ... mark article as read

    // Record the activity
    recordActivity.mutate({
      type: 'article',
      metadata: {
        articleId,
        timeSpentMinutes: timeSpent,
      },
    });
  };

  // ...
}
```

#### **Example 4: Record Trail Content Completion**

```typescript
import { useRecordActivity } from '@/features/gamification/hooks';

function TrailContentScreen() {
  const recordActivity = useRecordActivity();

  const handleContentComplete = (contentId: number, timeSpent: number) => {
    // ... your existing logic

    // Record the activity
    recordActivity.mutate({
      type: 'trail_content',
      metadata: {
        trailContentId: contentId,
        timeSpentMinutes: timeSpent,
      },
    });
  };

  // ...
}
```

#### **Example 5: Record Bookmark**

```typescript
import { useRecordActivity } from '@/features/gamification/hooks';

function BookmarkButton({ articleId }: { articleId: number }) {
  const recordActivity = useRecordActivity();

  const handleBookmark = () => {
    // ... add bookmark

    // Record the activity
    recordActivity.mutate({
      type: 'bookmark',
      metadata: {
        articleId,
      },
    });
  };

  // ...
}
```

---

## 📊 What Happens When an Activity is Recorded?

When you call `recordActivity.mutate()`:

1. **Daily Activity Updated**
   - Increments the appropriate counter (questions, quizzes, articles, etc.)
   - Adds time spent if provided

2. **Streak Updated**
   - If it's a new day, increments the streak
   - Updates `lastActivityDate`
   - Awards milestone achievements if reached

3. **Missions Progress Updated**
   - Checks all active missions
   - Increments progress for matching mission types
   - Marks missions as completed if target reached

4. **Cache Updated (Optimistic)**
   - UI updates immediately (optimistic update)
   - Invalidates and refetches data to ensure consistency

---

## 🎮 Admin: Creating Missions

### **Via API (Recommended)**

Use the admin endpoint to create missions:

```bash
POST /admin/gamification/missions
Content-Type: application/json

{
  "title": "Responda 5 Perguntas",
  "description": "Teste seus conhecimentos respondendo 5 perguntas hoje",
  "type": "complete_questions",
  "frequency": "daily",
  "targetValue": 5,
  "status": "active"
}
```

### **Mission Types Reference**

```typescript
type MissionType =
  | "complete_questions"      // Answer X questions
  | "complete_quiz"           // Complete X quizzes
  | "complete_trail_content"  // Complete X trail items
  | "read_article"            // Read X articles
  | "bookmark_articles"       // Bookmark X articles
  | "login_daily"             // Just login
  | "achieve_score"           // Get X points total
  | "spend_time_learning"     // Spend X minutes
  | "complete_streak";        // Maintain X day streak
```

### **Mission Frequencies**

```typescript
type MissionFrequency =
  | "daily"    // Assigned every day at midnight
  | "weekly"   // Assigned every Monday
  | "monthly"; // Assigned on 1st of month
```

---

## 🏆 Creating Streak Milestones

Streak milestones are rewards for reaching specific streak counts.

### **Database Seed Example**

```typescript
await db.insert(streakMilestones).values([
  {
    days: 3,
    title: "Iniciante Dedicado",
    description: "Manteve 3 dias de sequência",
    freezeReward: 1,
  },
  {
    days: 7,
    title: "Uma Semana Forte",
    description: "Completou 7 dias consecutivos",
    freezeReward: 2,
  },
  {
    days: 30,
    title: "Campeão Mensal",
    description: "30 dias de dedicação!",
    freezeReward: 5,
  },
]);
```

---

## 🔄 Background Jobs

### **Cron Jobs Setup**

The system automatically runs two daily jobs:

1. **Midnight (00:00)** - Assigns missions
2. **1 AM (01:00)** - Checks streaks

These are configured in `apps/server/src/lib/cron.ts` and run via `gamification.worker.ts`.

### **Manual Triggers (Testing)**

For testing, you can manually trigger these jobs:

```bash
# Assign missions to all users
POST /admin/gamification/assign-missions

# Check and break inactive streaks
POST /admin/gamification/check-streaks
```

---

## 🚀 Testing the Implementation

### **1. Start the Server**

```bash
bun dev:server
```

### **2. Start the Worker**

```bash
bun dev:worker
```

### **3. Start the Native App**

```bash
bun dev:native
```

### **4. Test Flow**

1. **View Home Screen**
   - See StatsCard with current streak
   - View weekly stats

2. **Tap "Sua Missão Diária"**
   - Navigate to missions screen
   - See daily/weekly/monthly missions

3. **Complete an Activity**
   - Answer a question / complete a quiz / read an article
   - Activity gets recorded automatically
   - Watch streak and mission progress update

4. **Tap on Streak**
   - Navigate to streak detail screen
   - See longest streak, freezes, milestones
   - Use a freeze if available

---

## 📝 Database Schema

All gamification tables are in `apps/server/src/db/schema/gamification.ts`:

- `missions` - Mission templates
- `user_missions` - User-specific mission assignments
- `user_streaks` - User streak data
- `user_daily_activities` - Daily activity logs
- `streak_milestones` - Milestone definitions
- `user_streak_milestones` - Achieved milestones

---

## 💡 Tips & Best Practices

1. **Always record activities** - Call `recordActivity` whenever users complete tasks
2. **Use optimistic updates** - The hooks handle this automatically
3. **Handle errors gracefully** - The mutations provide `onError` callbacks
4. **Seed initial missions** - Create default missions for a better UX
5. **Monitor worker logs** - Ensure cron jobs are running correctly

---

## 🎨 Customization

### **Styling**

All components use NativeWind (Tailwind for React Native). Customize colors in:
- Mission cards: `apps/native/features/gamification/components/mission-card.tsx`
- Streak card: `apps/native/features/gamification/components/streak-info-card.tsx`
- StatsCard: `apps/native/features/home/components/stats-card.tsx`

### **Mission Types**

Add new mission types by:
1. Adding to `missionTypeValues` in `apps/server/src/db/schema/gamification.ts`
2. Updating progress logic in `MissionsService.updateMissionProgress()`

---

## 🐛 Troubleshooting

### **Streaks not updating?**
- Check if activity recording is working
- Verify worker is running
- Check `lastActivityDate` in database

### **Missions not appearing?**
- Run manual mission assignment: `POST /admin/gamification/assign-missions`
- Check if missions are marked as `active`
- Verify user has missions in database

### **Freezes not working?**
- Check `freezesAvailable` count
- Verify freeze logic in `StreaksService.useFreeze()`

---

## 📞 Support

For issues or questions, check:
- Server logs: `apps/server/logs/`
- Worker logs: Console output when running `bun dev:worker`
- Database: Use `bun db:studio` to inspect data

---

**Built with ❤️ for Medwaster** 🎓
