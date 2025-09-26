# Sidebar Context Contract

## Provider Interface

```typescript
interface SidebarProviderProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
  persistState?: boolean;
  storageKey?: string;
}
```

## Context Value Contract

```typescript
interface SidebarContextValue {
  // State
  isExpanded: boolean;
  isMobile: boolean;
  isOverlay: boolean;
  userProfile: UserProfile | null;
  navigationItems: NavigationItem[];
  activeItemPath: string;
  
  // Actions
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setActiveItem: (path: string) => void;
  
  // Responsive
  handleResize: () => void;
  checkMobileState: () => boolean;
}
```

## State Management Contracts

### Initial State Requirements
- `isExpanded`: MUST load from localStorage if `persistState` is true
- `isMobile`: MUST be computed from current viewport width
- `userProfile`: MUST accept null for unauthenticated state
- `navigationItems`: MUST load from static configuration
- `activeItemPath`: MUST sync with current route

### State Persistence Requirements
- MUST save `isExpanded` to localStorage when changed
- MUST use provided `storageKey` or default to 'sidebar-expanded'
- MUST handle localStorage errors gracefully
- MUST not persist mobile/overlay states (viewport-dependent)

### State Update Requirements
- All state updates MUST be synchronous
- Context value MUST be memoized to prevent unnecessary re-renders
- State changes MUST trigger appropriate callbacks

## Hook Contract

### useSidebar Hook
```typescript
function useSidebar(): SidebarContextValue;
```

### Hook Requirements
- MUST throw error if used outside SidebarProvider
- MUST provide type-safe access to all context values
- MUST be optimized to prevent unnecessary re-renders

## Event Handling Contracts

### Resize Event
- MUST debounce resize events (300ms)
- MUST update mobile state based on viewport
- MUST handle orientation changes on mobile devices

### Storage Events
- MUST listen for localStorage changes from other tabs
- MUST sync sidebar state across browser tabs
- MUST handle storage quota exceeded errors

## Testing Contracts

### Context Testing
- MUST test provider initialization
- MUST test state persistence functionality
- MUST test responsive state changes
- MUST test error handling for storage failures

### Hook Testing  
- MUST test hook outside provider throws error
- MUST test all state mutations
- MUST test event handler registrations