# First Login Achievement Implementation

## Overview
Implemented automatic tracking of first login achievement using Better Auth hooks, with full integration into the mobile app's achievements UI.

## Implementation Details

### 1. Database Schema Change
Added `firstLoginAt` timestamp field to the user table to track when a user logs in for the first time (excluding the initial registration/sign-up).

**Migration:** `0009_glorious_proteus.sql`
```sql
ALTER TABLE "user" ADD COLUMN "first_login_at" timestamp;
```

### 2. Better Auth Hook
Added an `after` hook to the Better Auth configuration that:
- Triggers on sign-in paths (`/sign-in/*` and `/callback/*`)
- Excludes sign-up paths to differentiate between registration and actual login
- Checks if `firstLoginAt` is null (meaning this is the first non-registration login)
- Updates the user record with the current timestamp
- Calls the achievement tracking system

**Location:** `apps/server/src/lib/auth.ts`

```typescript
hooks: {
  after: createAuthMiddleware(async (ctx) => {
    const isSignIn = ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/callback");
    const isSignUp = ctx.path.startsWith("/sign-up");
    
    if (isSignIn && !isSignUp) {
      const newSession = ctx.context.newSession;
      if (newSession) {
        const user = newSession.user;
        
        if (!user.firstLoginAt) {
          await db
            .update(schema.user)
            .set({ firstLoginAt: new Date() })
            .where(eq(schema.user.id, user.id));
          
          await trackFirstLogin(user.id);
          console.log(`🎯 First login tracked for user ${user.id}`);
        }
      }
    }
  }),
}
```

### 3. Achievement System Integration
Uses the existing achievement tracking infrastructure:
- **Tracker:** `trackFirstLogin()` from `apps/server/src/modules/achievements/trackers.ts`
- **Engine:** `AchievementEngine.trackEvent()` processes the event
- **Achievement:** Pre-seeded "Primeiro Passo" (First Step) achievement

### 4. API Enhancement (Achievements with User Progress)
Updated the achievements endpoint to include user progress data:

**Location:** `apps/server/src/modules/achievements/index.ts`

```typescript
// Get user's progress for all achievements
const userProgress = await AchievementEngine.getUserAchievements(user!.id);
const progressMap = new Map(
  userProgress.map((p) => [p.achievementId, p])
);

// Merge achievement definitions with user progress
const achievementsWithProgress = visibleAchievements.map((achievement) => {
  const progress = progressMap.get(achievement.id);
  return {
    ...achievement,
    isUnlocked: progress?.isUnlocked || false,
    currentValue: progress?.currentValue || 0,
    targetValue: progress?.targetValue || 1,
    progressPercentage: progress?.progressPercentage || 0,
    unlockedAt: progress?.unlockedAt || null,
  };
});
```

### 5. Mobile App UI Updates
Updated the achievements screen to display unlock status:

**Files:**
- `apps/native/features/achievements/api.ts` - Added progress fields to Achievement type
- `apps/native/features/achievements/components/AchievementsList.tsx` - Use `isUnlocked` instead of hardcoded `locked={true}`
- `apps/native/features/achievements/components/AchievementCard.tsx` - Show unlocked badge and progress bar

**Features:**
- ✓ Visual "Desbloqueado" badge for unlocked achievements
- ✓ Progress bar showing completion percentage for in-progress achievements
- ✓ Full-color icons for unlocked achievements
- ✓ Grayed-out appearance for locked achievements

## How It Works

### User Journey
1. **Sign-up:** User creates account → session created but `firstLoginAt` stays null
2. **First Sign-in:** User logs in after registration → `firstLoginAt` set, achievement triggered
3. **View Achievements:** User sees "Primeiro Passo" unlocked in the app
4. **Subsequent Sign-ins:** `firstLoginAt` already set → no achievement tracking

### Supported Sign-in Methods
- Email/password sign-in (`/sign-in/email`)
- OAuth providers like Google (`/callback/google`)
- Any future sign-in methods

## Achievement Details
**Name:** Primeiro Passo (First Step)  
**Category:** General  
**Difficulty:** Bronze  
**Type:** Milestone  
**Rewards:** 10 points  
**Trigger:** `first_login` event  

## Testing

### Manual Testing
1. Create a new user account (sign-up)
2. Log out
3. Log in with the same credentials
4. Check that:
   - User's `firstLoginAt` timestamp is set
   - `achievement_events` table has a `first_login` event
   - `user_achievements` table shows the achievement unlocked
   - Console shows: `🎯 First login tracked for user [user-id]`
   - Mobile app shows the achievement as unlocked with checkmark

### Database Verification
```sql
-- Check user's firstLoginAt
SELECT id, email, "firstLoginAt", "createdAt" FROM "user" WHERE email = 'test@example.com';

-- Check achievement event
SELECT * FROM achievement_events WHERE user_id = '[user-id]' AND event_type = 'first_login';

-- Check unlocked achievement
SELECT * FROM user_achievements WHERE user_id = '[user-id]' AND is_unlocked = true;
```

### Mobile App Verification
1. Open achievements screen in the app
2. Console should show:
   - `📋 Achievements received: [count]`
   - `🔓 Unlocked count: 1` (or more)
3. "Primeiro Passo" should display with:
   - Green checkmark badge
   - Full-color icon
   - No gray overlay

## Bug Fixes
### Issue: Achievements not showing as unlocked in mobile app
**Problem:** The `/achievements` endpoint was returning only achievement definitions without user progress data. The mobile app hardcoded `locked={true}` for all achievements.

**Solution:** 
1. Modified the endpoint to fetch user progress and merge it with achievement data
2. Updated Achievement type to include progress fields
3. Changed AchievementsList to use `locked={!achievement.isUnlocked}`
4. Enhanced AchievementCard to show visual unlock indicators and progress

## Notes
- The implementation distinguishes between registration (sign-up) and actual login
- Works with both email/password and OAuth sign-in methods
- Uses Better Auth's session lifecycle hooks for reliable detection
- Leverages existing achievement tracking infrastructure (no new services needed)
- The `firstLoginAt` field provides a clean, explicit way to track this milestone
- API now returns user progress merged with achievement definitions for better UX

## Related Files
- `apps/server/src/db/schema/auth.ts` - User schema with firstLoginAt field
- `apps/server/src/lib/auth.ts` - Better Auth configuration with hook
- `apps/server/src/modules/achievements/trackers.ts` - trackFirstLogin function
- `apps/server/src/modules/achievements/engine.ts` - Achievement processing engine
- `apps/server/src/modules/achievements/index.ts` - API endpoints with progress merging
- `apps/server/src/db/seeds/achievements.ts` - First login achievement seed
- `apps/server/src/db/migrations/0009_glorious_proteus.sql` - Migration file
- `apps/native/features/achievements/api.ts` - TypeScript types
- `apps/native/features/achievements/components/AchievementsList.tsx` - List component
- `apps/native/features/achievements/components/AchievementCard.tsx` - Card component with unlock indicators

