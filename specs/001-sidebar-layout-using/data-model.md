# Data Model: Sidebar Layout

## User Profile Entity

**Purpose**: Represents the current authenticated user's display information in the sidebar

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin'
}
```

**Validation Rules**:
- `name`: Required, 1-50 characters, alphanumeric + underscores
- `email`: Required, valid email format
- `role`: Required, must be 'super-admin' or 'admin' only
- `avatar`: Optional, valid URL or base64 image

**Access Control**:
- Web application access is restricted to super-admin and admin roles only
- Regular users cannot authenticate or access the web interface

## Navigation Item Entity

**Purpose**: Represents individual menu items in the sidebar navigation

```typescript
interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType;
  order: number;
  isActive?: boolean;
}
```

**Validation Rules**:
- `label`: Required, 1-30 characters
- `path`: Required, valid route path format
- `icon`: Required React component
- `order`: Required, positive integer for sorting
- `isActive`: Computed based on current route

## Sidebar State Entity

**Purpose**: Manages the current state of the sidebar component

```typescript
interface SidebarState {
  isExpanded: boolean;
  isMobile: boolean;
  isOverlay: boolean;
  lastToggleTime: number;
}
```

**State Transitions**:
- `collapsed → expanded`: User clicks expand button or hovers (desktop)
- `expanded → collapsed`: User clicks collapse button or clicks outside (mobile)
- `desktop → mobile`: Viewport width changes trigger responsive behavior
- `mobile → desktop`: Viewport width changes trigger responsive behavior

**Persistence Rules**:
- `isExpanded`: Persisted in localStorage as `sidebar-expanded`
- `isMobile`: Computed from viewport, not persisted
- `isOverlay`: Computed based on mobile state and expansion
- `lastToggleTime`: Used for animation timing, not persisted

## Sidebar Context Entity

**Purpose**: Provides state management and actions for sidebar functionality

```typescript
interface SidebarContextType {
  state: SidebarState;
  userProfile: UserProfile | null;
  navigationItems: NavigationItem[];
  actions: {
    toggleSidebar: () => void;
    expandSidebar: () => void;
    collapseSidebar: () => void;
    setUserProfile: (profile: UserProfile) => void;
    updateActiveItem: (path: string) => void;
  };
}
```

**Relationships**:
- Contains current `SidebarState`
- Holds `UserProfile` for display
- Manages array of `NavigationItem`s
- Provides actions for state mutations

## Navigation Configuration

**Purpose**: Static configuration for sidebar navigation structure

```typescript
const NAVIGATION_CONFIG: Omit<NavigationItem, 'id' | 'isActive'>[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
    order: 1
  },
  {
    label: 'Questions',
    path: '/questions',
    icon: QuestionIcon,
    order: 2
  },
  {
    label: 'Wiki',
    path: '/wiki',
    icon: WikiIcon,
    order: 3
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: ProfileIcon,
    order: 4
  }
];
```

**Business Rules**:
- Navigation items are ordered by `order` field
- Icons must be imported React components
- Paths must match TanStack Router route definitions
- Labels should be concise and descriptive

## Responsive Breakpoints

**Purpose**: Defines viewport breakpoints for responsive behavior

```typescript
const BREAKPOINTS = {
  mobile: 768,   // Below this = mobile (overlay mode)
  tablet: 1024,  // Between mobile and desktop (auto-collapse)
  desktop: 1025  // Above this = full desktop experience
} as const;

type BreakpointType = keyof typeof BREAKPOINTS;
```

**Behavior Rules**:
- Mobile (`< 768px`): Sidebar becomes overlay drawer
- Tablet (`768px - 1024px`): Sidebar auto-collapses but stays in place
- Desktop (`> 1024px`): Sidebar can be expanded/collapsed freely
