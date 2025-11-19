# Sonner Native Integration

## Overview
Replaced custom achievement toast with **Sonner Native** - a high-performance, feature-rich toast library specifically designed for React Native.

## Why Sonner Native?

### Benefits
✅ **GPU-accelerated animations** - Uses Reanimated 3  
✅ **Swipe to dismiss** - Native gesture support  
✅ **Proper stacking** - Multiple toasts stack beautifully  
✅ **Rich features** - Close button, custom JSX, promise support  
✅ **High performance** - Benchmark score: 93.1  
✅ **Well maintained** - Active development, high reputation  

### Removed Custom Code
- ❌ `AchievementToast.tsx` - Custom toast component  
- ❌ `notification-context.tsx` - Custom context provider  
- ✅ Simplified to just using `toast.custom()` from Sonner

## Implementation

### Installation
```bash
bun add sonner-native
```

### Setup

**1. Add Toaster to root layout:**
```tsx
// apps/native/app/_layout.tsx
import { Toaster } from "sonner-native";

<SessionProvider>
  <Stack>{/* screens */}</Stack>
  <Toaster 
    position="top-center"
    richColors
    closeButton
    swipeToDismissDirection="up"
  />
</SessionProvider>
```

**2. Use toast.custom() in notification hook:**
```tsx
// apps/native/features/achievements/use-achievement-notifications.ts
import { toast } from "sonner-native";

toast.custom(
  (t) => (
    <View className="bg-white rounded-2xl shadow-2xl border-2 border-green-500 p-4">
      {/* Custom achievement card */}
    </View>
  ),
  {
    duration: 4000,
    onDismiss: () => router.push("/achievements"),
  }
);
```

## Features

### What Users Get
1. **Slide in from top** - Smooth animation
2. **Swipe up to dismiss** - Native gesture
3. **Auto-dismiss after 4s** - Or stays until swiped
4. **Tap to view achievements** - Navigates to achievements screen
5. **Stacking** - Multiple achievements stack nicely
6. **Close button** - Optional manual dismiss

### Configuration Options
```tsx
<Toaster 
  position="top-center"           // Where toasts appear
  richColors                      // Enhanced colors for success/error
  closeButton                     // Show X button
  swipeToDismissDirection="up"    // Swipe up to dismiss
  visibleToasts={3}               // Max visible at once
  duration={4000}                 // Default duration
/>
```

## Custom Achievement Toast

The achievement notification uses a fully custom design:

```tsx
<View className="bg-white rounded-2xl shadow-2xl border-2 border-green-500 p-4 mx-4">
  <View className="flex-row items-center">
    {/* Badge Icon with custom color */}
    <View style={{ backgroundColor: `${badgeColor}20` }}>
      <Icon icon={IconComponent} size={28} color={badgeColor} />
    </View>

    {/* Achievement Details */}
    <View className="flex-1">
      <Text>🏆 CONQUISTA DESBLOQUEADA!</Text>
      <Text>{achievement.name}</Text>
      <Text>{achievement.description}</Text>
    </View>

    {/* Sparkle */}
    <Text>✨</Text>
  </View>
</View>
```

## Comparison

### Before (Custom Toast)
```typescript
// Custom component with manual animations
const slideAnim = useRef(new Animated.Value(-200)).current;
const opacityAnim = useRef(new Animated.Value(0)).current;

<Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
  {/* Toast content */}
</Animated.View>
```

**Issues:**
- Manual animation management
- No gesture support
- No stacking
- Positioning issues
- More code to maintain

### After (Sonner Native)
```typescript
toast.custom(<CustomView />, { duration: 4000 });
```

**Benefits:**
- Automatic animations
- Built-in gestures
- Proper stacking
- Perfect positioning
- Less code!

## API Reference

### toast.custom()
```typescript
toast.custom(
  (toastId) => <YourComponent />,
  {
    duration: 4000,              // Auto-dismiss time
    onDismiss: () => {},         // Callback on dismiss
    onAutoClose: () => {},       // Callback on auto-close
    position: 'top-center',      // Override global position
    closeButton: true,           // Show close button
    dismissible: true,           // Allow user to dismiss
  }
);
```

### Other Toast Types
```typescript
// Simple text toast
toast('Hello!');

// Success toast
toast.success('Achievement unlocked!');

// Error toast
toast.error('Something went wrong');

// Promise toast (for async operations)
toast.promise(
  fetchData(),
  {
    loading: 'Loading...',
    success: 'Done!',
    error: 'Failed!',
  }
);
```

## Files Modified

### Modified
- `apps/native/app/_layout.tsx` - Added Toaster component
- `apps/native/features/achievements/use-achievement-notifications.ts` - Use toast.custom()
- `apps/native/features/achievements/index.ts` - Updated exports

### Deleted
- `apps/native/features/achievements/components/AchievementToast.tsx`
- `apps/native/features/achievements/notification-context.tsx`

### Dependencies
- **Added:** `sonner-native@0.21.1`
- **Already had:**
  - `react-native-reanimated` ✅
  - `react-native-gesture-handler` ✅
  - `react-native-safe-area-context` ✅

## Testing

1. **Sign up, log out, log in**
2. **Achievement should slide in from top**
3. **Try swiping up** - Should dismiss
4. **Try tapping** - Should navigate to achievements
5. **Multiple achievements** - Should stack beautifully

## Advanced Usage

### Custom Duration
```typescript
toast.custom(<CustomView />, { duration: 10000 }); // 10 seconds
```

### Infinite Duration
```typescript
toast.custom(<CustomView />, { duration: Infinity });
```

### Manual Dismiss
```typescript
const toastId = toast.custom(<CustomView />);
// Later...
toast.dismiss(toastId);
```

### Action Buttons
```typescript
toast.custom(<CustomView />, {
  action: {
    label: 'View',
    onClick: () => router.push('/achievements'),
  },
  cancel: {
    label: 'Dismiss',
    onClick: () => console.log('Cancelled'),
  },
});
```

## Related Documentation
- [Sonner Native GitHub](https://github.com/gunnartorfis/sonner-native)
- [ACHIEVEMENT_NOTIFICATIONS.md](./ACHIEVEMENT_NOTIFICATIONS.md) - Original implementation
- [ACHIEVEMENT_NOTIFICATION_TRACKING.md](./ACHIEVEMENT_NOTIFICATION_TRACKING.md) - Backend tracking

## Summary

Migrated from custom toast implementation to Sonner Native for:
- 🚀 Better performance (GPU-accelerated)
- ✨ Better UX (swipe to dismiss, stacking)
- 🎨 Better animations (native feel)
- 🔧 Less code to maintain
- 📦 Professional, battle-tested library

The achievement notifications now feel native and polished! 🎉
