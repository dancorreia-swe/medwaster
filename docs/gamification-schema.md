# Gamification Schema Documentation

This document describes the daily missions and streak system for MedWaster Learning.

## Overview

The gamification system encourages daily engagement through:
- **Daily/Weekly/Monthly Missions**: Goal-based challenges with various objectives
- **Streak Tracking**: Consecutive day activity tracking with freeze protection
- **Milestones**: Rewards for reaching streak goals

## Core Tables

### 1. `missions`

Defines available mission types that can be assigned to users.

**Key Fields:**
- `title`: Mission name (e.g., "Complete 5 Questions")
- `description`: Detailed mission description
- `type`: Enum defining mission objective type
- `frequency`: How often mission resets (daily, weekly, monthly)
- `targetValue`: Goal amount (e.g., 5 for "5 questions")
- `iconUrl`: Mission icon/badge image
- `validFrom`/`validUntil`: Time window for seasonal/special missions

**Mission Types:**
```typescript
- complete_questions      // "Complete X questions"
- complete_quiz          // "Complete X quizzes"
- complete_trail_content // "Complete X trail items"
- read_article           // "Read X articles"
- login_daily            // "Login for X consecutive days"
- achieve_score          // "Get X% or higher on a quiz"
- spend_time_learning    // "Study for X minutes"
- complete_streak        // "Maintain X day streak"
```

**Example Missions:**
```json
{
  "title": "Question Master",
  "description": "Complete 5 questions today",
  "type": "complete_questions",
  "frequency": "daily",
  "targetValue": 5
}

{
  "title": "Weekly Warrior",
  "description": "Complete 3 quizzes this week",
  "type": "complete_quiz",
  "frequency": "weekly",
  "targetValue": 3
}
```

### 2. `user_missions`

Tracks individual user progress on assigned missions.

**Key Fields:**
- `userId` + `missionId`: User and mission pair
- `assignedDate`: Date mission was assigned
- `currentProgress`: Progress toward target (0 to targetValue)
- `isCompleted`: Mission completed flag
- `completedAt`: Completion timestamp

**Lifecycle:**
1. Mission assigned to user daily/weekly/monthly
2. User activities increment `currentProgress`
3. When progress >= targetValue, mark `isCompleted = true`
4. Show in "Daily Missions" section with progress bars

**Progress Updates:**
- Automatically updated when user completes relevant activities
- Progress bar: `(currentProgress / targetValue) * 100%`
- Reset based on frequency (daily at midnight, weekly on Monday, etc.)

### 3. `user_streaks`

Tracks user's activity streak data.

**Key Fields:**
- `currentStreak`: Current consecutive active days
- `longestStreak`: Best streak ever achieved
- `lastActivityDate`: Last day user was active
- `currentStreakStartDate`: When current streak began
- `totalActiveDays`: Lifetime active days
- `freezesAvailable`: Streak freeze items in inventory
- `freezesUsed`: Total freezes consumed
- `lastFreezeUsedAt`: When last freeze was used

**Streak Logic:**
```
Day N-1: User active → lastActivityDate = N-1
Day N: User inactive → No change
Day N+1: User active → 
  - If lastActivityDate = N-1: currentStreak++ (still valid)
  - If lastActivityDate = N-2 AND freeze available: Use freeze, currentStreak maintained
  - If lastActivityDate < N-2: currentStreak = 1 (streak broken)
```

**Freeze Mechanics:**
- Users earn freezes through missions/milestones
- One freeze = skip one day without breaking streak
- Only works for single missed day
- Two consecutive missed days = streak broken even with freeze

### 4. `user_daily_activities`

Daily activity summary for each user.

**Fields:**
- `activityDate`: The date (used for streak calculation)
- `questionsCompleted`: Questions answered that day
- `quizzesCompleted`: Quizzes finished
- `articlesRead`: Articles viewed
- `trailContentCompleted`: Trail items completed
- `timeSpentMinutes`: Total study time
- `missionsCompleted`: Missions completed that day
- `streakDay`: Which day in current streak
- `freezeUsed`: Whether a freeze was consumed

**Purpose:**
- History of user engagement
- Streak validation
- Analytics and insights
- Mission progress tracking

### 5. `streak_milestones`

Predefined rewards for reaching streak goals.

**Fields:**
- `days`: Streak length requirement (7, 30, 100, etc.)
- `title`: Milestone name ("Week Warrior", "Century Club")
- `description`: Achievement description
- `badgeUrl`: Badge/trophy image
- `freezeReward`: Number of freezes awarded

**Example Milestones:**
```json
{ "days": 7, "title": "Week Warrior", "freezeReward": 1 }
{ "days": 30, "title": "Monthly Master", "freezeReward": 3 }
{ "days": 100, "title": "Century Club", "freezeReward": 5 }
{ "days": 365, "title": "Year Legend", "freezeReward": 10 }
```

### 6. `user_streak_milestones`

Tracks which milestones users have achieved.

**Fields:**
- `userId` + `milestoneId`: User and milestone pair
- `achievedAt`: When milestone was reached

## Key Relationships

```
missions (1) ----< (N) user_missions (N) >---- (1) user

user (1) ----< (1) user_streaks

user (1) ----< (N) user_daily_activities

streak_milestones (1) ----< (N) user_streak_milestones (N) >---- (1) user
```

## Business Logic

### Daily Mission Assignment

```typescript
// Pseudo-code for daily mission assignment
async function assignDailyMissions(userId: string, date: Date) {
  // Get all active daily missions
  const dailyMissions = await db.missions.findMany({
    where: { frequency: 'daily', status: 'active' }
  });
  
  // Randomly select 3-5 missions
  const selectedMissions = randomSample(dailyMissions, 3);
  
  // Assign to user
  for (const mission of selectedMissions) {
    await db.userMissions.create({
      userId,
      missionId: mission.id,
      assignedDate: date,
      currentProgress: 0
    });
  }
}
```

### Streak Update on Activity

```typescript
async function recordActivity(userId: string, date: Date) {
  const streak = await db.userStreaks.findUnique({ where: { userId } });
  const today = date;
  const yesterday = subDays(today, 1);
  const twoDaysAgo = subDays(today, 2);
  
  // First time user
  if (!streak.lastActivityDate) {
    await updateStreak(userId, { 
      currentStreak: 1, 
      lastActivityDate: today 
    });
    return;
  }
  
  // Already active today
  if (isSameDay(streak.lastActivityDate, today)) {
    return;
  }
  
  // Consecutive day
  if (isSameDay(streak.lastActivityDate, yesterday)) {
    await updateStreak(userId, {
      currentStreak: streak.currentStreak + 1,
      longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
      lastActivityDate: today
    });
    return;
  }
  
  // Missed yesterday but has freeze
  if (isSameDay(streak.lastActivityDate, twoDaysAgo) && streak.freezesAvailable > 0) {
    await updateStreak(userId, {
      currentStreak: streak.currentStreak + 1,
      freezesAvailable: streak.freezesAvailable - 1,
      freezesUsed: streak.freezesUsed + 1,
      lastFreezeUsedAt: now(),
      lastActivityDate: today
    });
    return;
  }
  
  // Streak broken
  await updateStreak(userId, {
    currentStreak: 1,
    currentStreakStartDate: today,
    lastActivityDate: today
  });
}
```

### Mission Progress Update

```typescript
async function onQuestionCompleted(userId: string) {
  const today = startOfDay(new Date());
  
  // Update daily activity
  await db.userDailyActivities.upsert({
    where: { userId_activityDate: { userId, activityDate: today } },
    update: { questionsCompleted: { increment: 1 } },
    create: { userId, activityDate: today, questionsCompleted: 1 }
  });
  
  // Update mission progress
  const missions = await db.userMissions.findMany({
    where: {
      userId,
      assignedDate: today,
      type: 'complete_questions',
      isCompleted: false
    }
  });
  
  for (const userMission of missions) {
    const newProgress = userMission.currentProgress + 1;
    const isCompleted = newProgress >= userMission.mission.targetValue;
    
    await db.userMissions.update({
      where: { id: userMission.id },
      data: {
        currentProgress: newProgress,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    });
  }
  
  // Record activity for streak
  await recordActivity(userId, today);
}
```

## API Endpoints (Suggested)

```typescript
// Get today's missions with progress
GET /api/missions/daily
Response: {
  missions: [
    {
      id: 1,
      title: "Question Master",
      description: "Complete 5 questions today",
      currentProgress: 3,
      targetValue: 5,
      isCompleted: false,
      iconUrl: "..."
    }
  ]
}

// Get user streak info
GET /api/streak
Response: {
  currentStreak: 15,
  longestStreak: 42,
  freezesAvailable: 2,
  nextMilestone: { days: 30, title: "Monthly Master" },
  daysUntilMilestone: 15
}

// Get streak calendar (last 30 days)
GET /api/streak/calendar
Response: {
  days: [
    { date: "2025-01-01", active: true, streakDay: 1 },
    { date: "2025-01-02", active: true, streakDay: 2 },
    { date: "2025-01-03", active: false, freezeUsed: true },
  ]
}

// Use a streak freeze
POST /api/streak/freeze
Body: { date: "2025-01-15" }
Response: { success: true, freezesRemaining: 1 }
```

## Mobile App UI Components

### Daily Missions Section
```
┌─────────────────────────────────┐
│ 🎯 Daily Missions               │
├─────────────────────────────────┤
│ ⭐ Question Master         3/5  │
│ ▓▓▓▓▓▓░░░░ 60%                 │
│                                 │
│ 📚 Knowledge Seeker       1/3  │
│ ▓▓░░░░░░░░ 33%                 │
│                                 │
│ ✅ Daily Login            ✓    │
│ ▓▓▓▓▓▓▓▓▓▓ 100% Complete!      │
└─────────────────────────────────┘
```

### Streak Widget
```
┌─────────────────────────────────┐
│ 🔥 15 Day Streak!               │
│ Keep it going!                  │
│                                 │
│ Best: 42 days                   │
│ ❄️ Freezes: 2                   │
│                                 │
│ Next: Monthly Master (15 days) │
└─────────────────────────────────┘
```

### Calendar View
```
    Mo Tu We Th Fr Sa Su
    🔥 🔥 🔥 🔥 🔥 ❄️ 🔥  Week 1
    🔥 🔥 ⭕ ⭕ ⭕ ⭕ ⭕  Week 2
    
    🔥 Active day
    ❄️ Freeze used
    ⭕ Inactive (streak broken)
```

## Integration Notes

### With Trails System
- Trail content completion counts toward missions
- Time spent in trails tracked for time-based missions
- Quiz scores can trigger achievement missions

### With Questions System
- Question completion automatically updates mission progress
- Quiz completion triggers quiz missions
- Score thresholds for achievement missions

### With Wiki System
- Article views count toward reading missions
- Time spent reading tracked
- Can have "read X articles" missions

## Database Indexes

All tables properly indexed for:
- User lookups (userId)
- Date-based queries (assignedDate, activityDate)
- Mission filtering (type, frequency, status)
- Streak calculations (lastActivityDate)

## Future Enhancements

1. **Social Features**
   - Leaderboards (longest streaks)
   - Friend challenges
   - Team missions

2. **Advanced Missions**
   - Multi-step missions
   - Achievement chains
   - Special event missions

3. **Notifications**
   - Streak reminder at 11pm
   - Mission completion alerts
   - Milestone achievements

4. **Analytics**
   - Most popular missions
   - Average completion rates
   - Engagement patterns
