# Gamification Schema Implementation Summary

## Overview
Created a daily missions and streak tracking system for MedWaster Learning without XP mechanics, focusing on engagement through goal-based challenges and consecutive day activity tracking.

## Files Created

### 1. `/apps/server/src/db/schema/gamification.ts` (298 lines)
Complete Drizzle ORM schema for missions and streaks system.

### 2. `/docs/gamification-schema.md`
Comprehensive documentation with business logic, API examples, and UI mockups.

## Schema Components

### Core Tables (6 total)

1. **`missions`** - Mission definitions (admin-created)
   - Title, description, icon
   - Mission type (8 types: questions, quizzes, trails, articles, login, score, time, streak)
   - Frequency (daily, weekly, monthly)
   - Target value (e.g., "5 questions", "80% score")
   - Validity time windows for special events

2. **`user_missions`** - User mission assignments & progress
   - Assigned date (for frequency reset)
   - Current progress (0 to target)
   - Completion status
   - Automatic progress tracking from user activities

3. **`user_streaks`** - Per-user streak tracking
   - Current streak (consecutive active days)
   - Longest streak (all-time best)
   - Last activity date (for streak validation)
   - Freeze inventory (skip days without breaking streak)
   - Total active days (lifetime)

4. **`user_daily_activities`** - Daily activity summary
   - Date-specific activity counts:
     - Questions completed
     - Quizzes completed  
     - Articles read
     - Trail content completed
   - Time spent learning
   - Missions completed
   - Streak day number
   - Freeze usage flag

5. **`streak_milestones`** - Streak achievement rewards
   - Day thresholds (7, 30, 100, 365, etc.)
   - Title and description
   - Badge/trophy image
   - Freeze rewards (1-10 freezes)

6. **`user_streak_milestones`** - User achievement tracking
   - Which milestones achieved
   - Achievement timestamps

## Key Features

### Mission System ✅
- **8 Mission Types:**
  - `complete_questions` - "Complete X questions"
  - `complete_quiz` - "Complete X quizzes"
  - `complete_trail_content` - "Complete X trail items"
  - `read_article` - "Read X articles"
  - `login_daily` - "Login for X consecutive days"
  - `achieve_score` - "Get X% or higher"
  - `spend_time_learning` - "Study for X minutes"
  - `complete_streak` - "Maintain X day streak"

- **Frequency Options:**
  - Daily (reset at midnight)
  - Weekly (reset on Monday)
  - Monthly (reset on 1st)

- **Auto-Assignment:**
  - Daily missions assigned each morning
  - Random selection from active mission pool
  - 3-5 missions per day

- **Progress Tracking:**
  - Real-time progress updates
  - Progress bars (currentProgress / targetValue)
  - Completion detection

### Streak System ✅
- **Consecutive Day Tracking:**
  - Current streak counter
  - All-time longest streak
  - Streak start date tracking

- **Freeze Mechanic:**
  - Skip 1 day without breaking streak
  - Earned through missions/milestones
  - Automatic or manual usage
  - Inventory system (can accumulate)

- **Streak Validation:**
  ```
  Today active + Yesterday active = Streak continues
  Today active + 1 day gap + Freeze available = Streak continues (freeze consumed)
  Today active + 2+ day gap = Streak broken (reset to 1)
  ```

- **Milestone Rewards:**
  - 7 days = Week Warrior + 1 freeze
  - 30 days = Monthly Master + 3 freezes
  - 100 days = Century Club + 5 freezes
  - 365 days = Year Legend + 10 freezes

### Activity Tracking ✅
- Daily activity summaries
- Historical engagement data
- Analytics for insights
- Supports all mission types

## Enums (3 total)

```typescript
mission_type: 
  'complete_questions' | 'complete_quiz' | 'complete_trail_content' |
  'read_article' | 'login_daily' | 'achieve_score' | 
  'spend_time_learning' | 'complete_streak'

mission_frequency: 'daily' | 'weekly' | 'monthly'

mission_status: 'active' | 'inactive' | 'archived'
```

## Type Exports (12 total)

```typescript
Mission, NewMission
MissionType, MissionFrequency, MissionStatus

UserMission, NewUserMission

UserStreak, NewUserStreak

UserDailyActivity, NewUserDailyActivity

StreakMilestone, NewStreakMilestone

UserStreakMilestone, NewUserStreakMilestone
```

## Integration Points

### With Trails System ✅
- Trail content completion → updates missions
- Time in trails → time-based missions
- Trail scores → achievement missions

### With Questions System ✅
- Question answers → question missions
- Quiz completion → quiz missions
- Quiz scores → score missions

### With Wiki System ✅
- Article views → reading missions
- Reading time → time missions

### With Auth System ✅
- Daily login → login missions
- User streaks per account

## Business Logic Examples

### Example 1: Daily Mission Flow
```typescript
// Morning: Assign 3 random daily missions
assignDailyMissions(user) // "Complete 5 questions", "Read 2 articles", "Study 30 min"

// User completes question
onQuestionComplete(user) // Progress: 1/5

// User completes 4 more questions
onQuestionComplete(user) // Progress: 5/5 → Mission Complete! ✓

// Midnight: Reset daily missions for tomorrow
```

### Example 2: Streak with Freeze
```typescript
Day 1: User active → currentStreak = 1
Day 2: User active → currentStreak = 2
Day 3: User INACTIVE → No change yet
Day 4: User active + has freeze → currentStreak = 3, freeze used
Day 5: User INACTIVE (no freeze) → currentStreak = 1 (broken)
```

### Example 3: Milestone Achievement
```typescript
User reaches 7 day streak:
1. Check milestone: 7 days = "Week Warrior"
2. Award badge + 1 freeze
3. Save to user_streak_milestones
4. Show celebration UI
5. Update freezesAvailable += 1
```

## Suggested API Endpoints

```
GET  /api/missions/daily          # Today's missions with progress
GET  /api/missions/weekly         # Weekly missions
GET  /api/streak                  # Current streak info
GET  /api/streak/calendar?days=30 # Last 30 days activity
POST /api/streak/freeze           # Manually use freeze
GET  /api/milestones              # All milestones + user progress
GET  /api/stats/daily             # Today's activity summary
```

## Mobile App UI Suggestions

### Home Screen Widget
```
┌────────────────────────┐
│ 🔥 15 Day Streak!      │
│ 🎯 2/3 Missions Done   │
└────────────────────────┘
```

### Missions Screen
- List of today's missions
- Progress bars for each
- Completion checkmarks
- Tap to see details
- Auto-refresh on activity

### Streak Screen
- Big streak counter with flame icon
- Calendar view (last 30 days)
- Freeze inventory display
- Next milestone countdown
- Longest streak trophy

### Calendar Legend
- 🔥 Active day
- ❄️ Freeze used
- ⭕ Missed day (streak broken)
- 🏆 Milestone achieved

## Database Performance

### Indexes Created
- User lookups (all user_* tables)
- Date filtering (assigned_date, activity_date)
- Mission filtering (type, frequency, status)
- Streak queries (last_activity_date)
- Compound indexes for common queries

### Query Optimization
- Efficient user + date lookups
- Fast mission progress updates
- Quick streak validation
- Historical data access

## Next Steps

1. **Migration**
   ```bash
   drizzle-kit generate:pg
   drizzle-kit push:pg
   ```

2. **Cron Jobs**
   - Daily mission assignment (midnight)
   - Weekly mission reset (Monday 00:00)
   - Monthly mission reset (1st 00:00)
   - Streak validation (on first activity of day)

3. **Event Listeners**
   - Question completed → update missions + streak
   - Quiz completed → update missions + streak
   - Article viewed → update missions + streak
   - Trail content done → update missions + streak

4. **Push Notifications**
   - "Don't break your streak!" (evening reminder)
   - "Daily missions available!" (morning)
   - "Milestone achieved!" (real-time)
   - "Use a freeze?" (when about to lose streak)

## Notes

- ✅ No XP system (as requested)
- ✅ Focus on engagement, not points
- ✅ Simple, clear mission objectives
- ✅ Forgiving streak system (freezes)
- ✅ Milestone rewards encourage long-term commitment
- ✅ All timestamps timezone-aware
- ✅ Flexible mission types for future expansion
- ✅ Analytics-ready with daily activity tracking
