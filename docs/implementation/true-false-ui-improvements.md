# True/False Question - UI Improvements & State Management

## 🎨 UI Changes Made

### 1. **Centered and Larger Title**
```tsx
// Before
<Text className="text-primary text-xs font-semibold tracking-wider mb-2 uppercase">
  VERDADEIRO OU FALSO
</Text>

// After
<Text className="text-primary text-2xl font-bold tracking-wide text-center">
  Verdadeiro ou Falso
</Text>
```

### 2. **Side-by-Side Buttons with Icons**

Changed from vertical stack to horizontal row with icon-only buttons:

```tsx
<View className="flex-row gap-4 px-4">
  {/* Falso Button - Red with X icon */}
  <TouchableOpacity className="flex-1 rounded-3xl py-8 items-center">
    <X size={48} color="#EF4444" strokeWidth={3} />
    <Text className="text-red-600 text-lg font-bold mt-2">Falso</Text>
  </TouchableOpacity>

  {/* Verdadeiro Button - Green with Check icon */}
  <TouchableOpacity className="flex-1 rounded-3xl py-8 items-center">
    <Check size={48} color="#22C55E" strokeWidth={3} />
    <Text className="text-green-600 text-lg font-bold mt-2">Verdadeiro</Text>
  </TouchableOpacity>
</View>
```

### 3. **Light Opacity Colors**

#### Color Scheme:
- **Falso (False)**: Red tones
  - Unselected: `bg-red-500/10 border-red-500/30` (very light)
  - Selected: `bg-red-500/20 border-red-500` (light opacity)
  - Icon: `#EF4444` (red-500)
  - Text: `text-red-600`

- **Verdadeiro (True)**: Green tones
  - Unselected: `bg-green-500/10 border-green-500/30` (very light)
  - Selected: `bg-green-500/20 border-green-500` (light opacity)
  - Icon: `#22C55E` (green-500)
  - Text: `text-green-600`

## 🔄 State Management with Zustand

### Store Created: `stores/trail-store.ts`

```typescript
interface TrailState {
  trails: Record<string, Module[]>;
  initializeTrail: (trailId: string, modules: Module[]) => void;
  completeCurrentModule: (trailId: string) => void;
  getTrailModules: (trailId: string) => Module[];
}
```

### Key Features:
1. **Centralized State**: All trail progress managed in one place
2. **Persistent Across Navigation**: State survives page changes
3. **Simple API**: Clean methods for module completion

### Usage in Trail Detail:

```typescript
const { trails, initializeTrail, completeCurrentModule, getTrailModules } = useTrailStore();
const modules = getTrailModules(id) || journey?.modules || [];

// Initialize on first load
useEffect(() => {
  if (journey && !trails[id]) {
    initializeTrail(id, journey.modules);
  }
}, [id, journey]);

// Handle unlock on return
useEffect(() => {
  if (unlockNext) {
    completeCurrentModule(id);
  }
}, [unlockNext, id]);
```

## 🎯 Unlock Next Module Logic

### Flow:
1. User answers question correctly
2. Navigate back with `unlock-next=true` param
3. Zustand store updates:
   - Current module → `completed`
   - Next module → `current` (unlocked)
4. UI automatically reflects changes

### Question Navigation:

```typescript
const handleContinue = () => {
  const isCorrect = selectedAnswer === question.correctAnswer;
  if (isCorrect) {
    router.push(`/(app)/(tabs)/trails/${question.trailId}?unlock-next=true`);
  } else {
    router.push(`/(app)/(tabs)/trails/${question.trailId}`);
  }
};
```

## 📱 Visual States

### Initial State
```
┌─────────────────────────────────────┐
│         ← Back                       │
│                                      │
│    Verdadeiro ou Falso               │
│         (centered, large)            │
│                                      │
│  ┌─────────────────────────────┐    │
│  │   Question text centered     │   │
│  │   in the middle              │   │
│  └─────────────────────────────┘    │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │    ✗     │  │    ✓     │         │
│  │  Falso   │  │Verdadeiro│         │
│  │  (red)   │  │ (green)  │         │
│  └──────────┘  └──────────┘         │
│                                      │
│  [  Confirmar Resposta  ]            │
└─────────────────────────────────────┘
```

### Selected State (Before Confirm)
```
┌─────────────────────────────────────┐
│    Verdadeiro ou Falso               │
│                                      │
│       Question text...               │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │    ✗     │  │    ✓     │         │
│  │  Falso   │  │Verdadeiro│         │
│  │ (light)  │  │(SELECTED)│         │
│  │          │  │  20%     │         │
│  └──────────┘  └──────────┘         │
│                                      │
│  [  Confirmar Resposta  ] (active)   │
└─────────────────────────────────────┘
```

### After Correct Answer
```
┌─────────────────────────────────────┐
│    Verdadeiro ou Falso               │
│                                      │
│  ┌─────────────────────────────┐    │
│  │ ✓ Correto!                  │    │
│  │ Explanation text...         │    │
│  └─────────────────────────────┘    │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │    ✗     │  │    ✓     │         │
│  │  Falso   │  │Verdadeiro│         │
│  │          │  │  GREEN   │         │
│  └──────────┘  └──────────┘         │
│                                      │
│  [     Continuar     ]               │
└─────────────────────────────────────┘
```

## 🔧 Files Modified

### Created:
1. **`apps/native/stores/trail-store.ts`**
   - Zustand store for trail progress management
   - Methods: `initializeTrail`, `completeCurrentModule`, `getTrailModules`

### Updated:
1. **`apps/native/app/(app)/questions/[id].tsx`**
   - Centered title with larger font
   - Side-by-side buttons with icons
   - Light opacity colors for red/green
   - Navigation with `unlock-next` param

2. **`apps/native/app/(app)/(tabs)/trails/[id].tsx`**
   - Integrated Zustand store
   - Simplified state management
   - Auto-unlock next module on correct answer

## 🎨 Design Tokens Used

```typescript
// Colors
const colors = {
  red: {
    icon: '#EF4444',      // red-500
    text: 'text-red-600',
    bgLight: 'bg-red-500/10',
    bgSelected: 'bg-red-500/20',
    borderLight: 'border-red-500/30',
    borderSelected: 'border-red-500',
  },
  green: {
    icon: '#22C55E',      // green-500
    text: 'text-green-600',
    bgLight: 'bg-green-500/10',
    bgSelected: 'bg-green-500/20',
    borderLight: 'border-green-500/30',
    borderSelected: 'border-green-500',
  }
}

// Sizes
const sizes = {
  icon: 48,
  iconStroke: 3,
  title: 'text-2xl',
  buttonText: 'text-lg',
  buttonPadding: 'py-8',
  borderRadius: 'rounded-3xl',
}
```

## ✅ Benefits of This Approach

1. **Better UX**
   - Cleaner, more modern interface
   - Icons make choices instantly recognizable
   - Light opacity creates softer, more approachable design

2. **State Management**
   - Zustand provides clean, simple API
   - No prop drilling
   - Easy to debug with DevTools
   - Scales well for future features

3. **Maintainability**
   - Centralized trail logic
   - Easy to add new module types
   - Simple to persist state later (localStorage/AsyncStorage)

4. **Performance**
   - Zustand is lightweight (1KB)
   - Only re-renders components that use changed state
   - No unnecessary renders

## 🚀 Next Steps

### Potential Enhancements:
1. **Persist state** with `zustand/middleware/persist`
2. **Add animations** for button selection
3. **Haptic feedback** on selection (iOS/Android)
4. **Confetti effect** on correct answer
5. **Progress bar** at top of question screen
6. **Sound effects** (optional)

### Store Extensions:
```typescript
// Add to trail-store.ts
interface TrailState {
  // ... existing
  getProgress: (trailId: string) => number;
  getCurrentModule: (trailId: string) => Module | null;
  resetTrail: (trailId: string) => void;
  skipModule: (trailId: string, moduleId: string) => void; // For testing
}
```

---

**Status**: ✅ All UI improvements and state management implemented
**Last Updated**: 2025-10-21 19:45
