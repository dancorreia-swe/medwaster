# Achievement Notification System

## Overview
Real-time toast-style notifications for achievement unlocks without requiring WebSockets. Uses polling on app focus and navigation events.

## Architecture

### **Notification Flow**
```
User Action → Backend Achievement Engine → Database Update
                                              ↓
App Focus/Navigation → Poll `/recent-unlocks` → Check for new achievements
                                              ↓
                          Show Toast Notification → Auto-dismiss after 4s
```

### **Components**

1. **AchievementToast** (`components/AchievementToast.tsx`)
   - Animated slide-in notification from top
   - Shows achievement icon, name, description
   - Tappable to navigate to achievements screen
   - Auto-dismisses after 4 seconds

2. **AchievementNotificationProvider** (`notification-context.tsx`)
   - Context provider for global notification state
   - Manages currently displayed toast
   - Provides `showAchievement()` function

3. **useAchievementNotifications** (`use-achievement-notifications.ts`)
   - Hook to check for new achievements
   - Polls `/recent-unlocks` endpoint
   - Triggers on:
     - App mount
     - App comes to foreground (from background)
     - Manual trigger (navigation events)

## Implementation

### 1. Wrap App with Provider
**File:** `app/_layout.tsx`

```tsx
import { AchievementNotificationProvider } from "@/features/achievements";

<SessionProvider>
  <AchievementNotificationProvider>
    <Stack>
      {/* screens */}
    </Stack>
  </AchievementNotificationProvider>
</SessionProvider>
```

### 2. Use Hook in Key Screens
**File:** `app/(app)/(tabs)/index.tsx`

```tsx
import { useAchievementNotifications } from "@/features/achievements";

export default function Home() {
  // Automatically checks for achievements
  useAchievementNotifications();
  
  // rest of component...
}
```

### 3. Manual Trigger (Optional)
For immediate notifications after specific actions:

```tsx
import { useAchievementNotification } from "@/features/achievements";

const { showAchievement } = useAchievementNotification();

// After completing an action that might unlock achievement
const handleComplete = async () => {
  await completeAction();
  
  // Manually trigger achievement check
  // OR show specific achievement
  showAchievement({
    id: 1,
    name: "Primeiro Passo",
    description: "Faça seu primeiro login",
    badgeIcon: "log-in",
    badgeColor: "#10B981",
    category: "general",
  });
};
```

## Features

### ✅ What It Does
- [x] Shows toast notification when achievements are unlocked
- [x] Animated slide-in from top
- [x] Auto-dismisses after 4 seconds
- [x] Tap to view all achievements
- [x] Prevents duplicate notifications
- [x] Checks on app focus (returning from background)
- [x] Works offline (shows on next online check)
- [x] Staggers multiple achievements (5s apart)

### ❌ What It Doesn't Do (Yet)
- [ ] Real-time via WebSockets (see Future Enhancements)
- [ ] Sound/haptic feedback
- [ ] Push notifications when app is closed
- [ ] Achievement celebration modal (separate feature)

## API Endpoint Used

**GET** `/achievements/recent-unlocks?limit=5`

Returns recently unlocked achievements:
```typescript
{
  success: true,
  data: [
    {
      achievementId: 1,
      userId: "user-id",
      unlockedAt: "2024-11-16T19:30:00Z",
      achievement: {
        id: 1,
        name: "Primeiro Passo",
        description: "Faça seu primeiro login",
        badgeIcon: "log-in",
        badgeColor: "#10B981",
        category: "general",
        // ... other fields
      }
    }
  ]
}
```

## How It Works

### Deduplication Strategy
1. **Time-based:** Only shows achievements unlocked after `lastCheckRef`
2. **ID-based:** Tracks shown achievement IDs in `shownAchievementsRef`
3. **Session-scoped:** Resets when app is fully closed and reopened

### Polling Strategy
- **On mount:** Checks immediately when component mounts
- **On foreground:** Checks when app returns from background
- **No interval polling:** Reduces battery usage and API calls

### Multiple Achievements
If multiple achievements are unlocked simultaneously:
- Shows them one at a time
- 5-second stagger between each toast
- Prevents notification spam

## User Experience

### Visual Design
- Green border indicates success
- Full-color achievement icon
- Trophy icon + "CONQUISTA DESBLOQUEADA!" header
- Achievement name (bold)
- Achievement description (truncated to 1 line)
- Sparkle emoji (✨) for delight
- Green progress bar animation

### Interaction
- **Tap:** Navigate to achievements screen
- **Wait:** Auto-dismisses after 4s
- **Swipe (future):** Could add swipe-to-dismiss

## Testing

### Manual Testing
1. **First Login Achievement:**
   - Create account, log out, log back in
   - Return to home screen
   - Toast should appear within 1-2 seconds

2. **Multiple Achievements:**
   - Unlock several achievements via database
   - Kill and reopen app
   - Should see toasts staggered 5 seconds apart

3. **App Backgrounding:**
   - Have app open on home screen
   - Background app (home button)
   - Complete action that unlocks achievement (via web)
   - Return to app
   - Toast should appear

### Database Simulation
```sql
-- Unlock an achievement for testing
INSERT INTO user_achievements (user_id, achievement_id, is_unlocked, unlocked_at, target_value, current_value, progress_percentage)
VALUES ('your-user-id', 1, true, NOW(), 1, 1, 100);

INSERT INTO achievement_history (user_id, achievement_id, trigger_event, unlocked_at)
VALUES ('your-user-id', 1, 'test', NOW());
```

## Performance Considerations

### API Calls
- Only 1 API call per app focus
- Limit=5 keeps payload small
- No background polling (battery friendly)

### Memory
- `shownAchievementsRef` is session-scoped Set
- Cleared when app is fully closed
- Grows at most to ~100 items (reasonable)

### Animation
- Uses `useNativeDriver` for smooth 60fps
- Slide + opacity animations
- Progress bar width animation

## Future Enhancements

### Option 1: WebSocket Real-time Notifications
**When needed:** For competitive features, leaderboards, social achievements

**Implementation:**
1. Add Socket.io server endpoint
2. Emit achievement events from backend
3. Listen in mobile app
4. Show toast immediately

```typescript
// Backend
io.to(userId).emit('achievement:unlocked', achievement);

// Frontend
socket.on('achievement:unlocked', (achievement) => {
  showAchievement(achievement);
});
```

**Pros:** Instant notifications
**Cons:** Battery drain, connection management, complexity

### Option 2: Push Notifications
**When needed:** Achievements unlocked when app is closed

**Implementation:**
- Use Expo Notifications
- Send from backend when achievement unlocks
- Tap notification opens achievements screen

### Option 3: Celebration Modal
**When needed:** Major achievements (certificates, milestones)

**Implementation:**
- Similar to trail celebration screen
- Confetti, animations, stats
- "View All Achievements" CTA

```typescript
if (achievement.category === 'certification') {
  router.push({
    pathname: '/achievement-celebration',
    params: { achievementId: achievement.id }
  });
} else {
  showAchievement(achievement);
}
```

## Troubleshooting

### Notifications not showing
1. Check achievement was actually unlocked in DB
2. Check `console.log` in `useAchievementNotifications`
3. Verify API endpoint `/recent-unlocks` returns data
4. Check notification provider is wrapping app
5. Ensure hook is called in active screen

### Multiple duplicate toasts
- Clear app data/cache
- `shownAchievementsRef` might be persisting incorrectly

### Toast not dismissing
- Check animations are using `useNativeDriver`
- Verify timer is not being cancelled

## Files Modified/Created

### Created
- `apps/native/features/achievements/components/AchievementToast.tsx`
- `apps/native/features/achievements/notification-context.tsx`
- `apps/native/features/achievements/use-achievement-notifications.ts`

### Modified
- `apps/native/features/achievements/index.ts` - Added exports
- `apps/native/app/_layout.tsx` - Added provider
- `apps/native/app/(app)/(tabs)/index.tsx` - Added hook

## Related Documentation
- `FIRST_LOGIN_IMPLEMENTATION.md` - Achievement tracking backend
- Trail celebration screen - Inspiration for celebration modal
- Better Auth hooks - Session lifecycle

## Summary
A lightweight, battery-friendly achievement notification system that provides immediate visual feedback for unlocked achievements without requiring WebSockets or background polling. Perfect for most use cases, with clear upgrade path to real-time if needed.
