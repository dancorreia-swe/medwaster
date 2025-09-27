# Quickstart: Sidebar Layout Testing

## Manual Testing Scenarios

### Scenario 1: Basic Sidebar Functionality
**Given**: Admin user is authenticated and on the web application homepage
**When**: User views the page
**Then**: 
1. Sidebar appears on the left side of the screen
2. Navigation items (Dashboard, Questions, Wiki, Profile) are visible
3. User profile information displays at the bottom showing admin or super-admin role
4. Current page is highlighted in navigation

**Manual Steps**:
1. Login as admin or super-admin user
2. Open browser to `http://localhost:3000`
3. Verify sidebar is visible and properly positioned
4. Check all 4 navigation items are present with icons and labels
5. Confirm user profile section shows username, email, and role (admin/super-admin)
6. Verify current route is highlighted in navigation

### Scenario 2: Sidebar Collapse/Expand
**Given**: Sidebar is in expanded state
**When**: User clicks the collapse button
**Then**: 
1. Sidebar smoothly animates to collapsed state
2. Only icons are visible, labels are hidden
3. User profile shows condensed view (avatar only)
4. State is persisted when page refreshes

**Manual Steps**:
1. Click the collapse/minimize button on sidebar
2. Verify animation is smooth (< 300ms)
3. Check icons remain visible but labels are hidden
4. Confirm user profile shows only avatar/initials
5. Refresh page and verify collapsed state persists
6. Click expand button and verify reverse behavior

### Scenario 3: Navigation Functionality
**Given**: Sidebar is displayed with navigation items
**When**: User clicks on a navigation item
**Then**: 
1. Navigation routes to correct page
2. Clicked item becomes active/highlighted
3. Previous active item becomes inactive
4. URL updates correctly

**Manual Steps**:
1. Click "Dashboard" navigation item
2. Verify URL changes to `/dashboard`
3. Confirm Dashboard item is highlighted as active
4. Repeat for Questions (`/questions`), Wiki (`/wiki`), Profile (`/profile`)
5. Use browser back button and verify active state updates

### Scenario 4: Responsive Behavior - Tablet
**Given**: Browser viewport is at tablet size (768px - 1024px)
**When**: User loads the page
**Then**: 
1. Sidebar automatically starts in collapsed state
2. Expand/collapse functionality still works
3. Sidebar remains in place (not overlay)

**Manual Steps**:
1. Resize browser window to 900px width
2. Refresh page and verify sidebar starts collapsed
3. Click expand button and verify it expands normally
4. Verify sidebar doesn't overlay content
5. Test collapse functionality works properly

### Scenario 5: Responsive Behavior - Mobile
**Given**: Browser viewport is at mobile size (< 768px)
**When**: User interacts with sidebar
**Then**: 
1. Sidebar becomes an overlay drawer
2. Opening sidebar overlays main content
3. Clicking outside sidebar closes it
4. Navigation still functions properly

**Manual Steps**:
1. Resize browser to 400px width (mobile size)
2. Verify sidebar is hidden initially
3. Click hamburger/menu button to open sidebar
4. Confirm sidebar overlays content (has backdrop)
5. Click outside sidebar and verify it closes
6. Test navigation items still work in mobile mode

### Scenario 6: State Persistence
**Given**: User has customized sidebar state
**When**: User refreshes browser or opens new tab
**Then**: 
1. Sidebar expansion state is preserved
2. User profile information is maintained
3. Active navigation state updates correctly

**Manual Steps**:
1. Set sidebar to collapsed state
2. Navigate to different page (e.g., Questions)
3. Refresh browser page
4. Verify sidebar remains collapsed
5. Verify Questions remains active navigation item
6. Open new tab to same site and verify state consistency

### Scenario 8: Role-Based Access Control
**Given**: Users with different roles attempt to access the web application
**When**: User attempts to login or access the sidebar
**Then**: 
1. Admin and super-admin users can authenticate and see sidebar
2. Regular users are denied access to the web application
3. Unauthenticated users are redirected to login
4. User role is correctly displayed in profile section

**Manual Steps**:
1. Attempt login with regular user credentials
2. Verify access is denied and user cannot reach main application
3. Login with admin user credentials
4. Verify full access to sidebar and navigation
5. Check profile section shows "admin" role correctly
6. Login with super-admin user credentials
7. Verify full access and "super-admin" role is displayed
8. Test direct URL access without authentication is blocked
**Given**: User has long username or email
**When**: Sidebar displays user profile
**Then**: 
1. Text truncates gracefully with ellipsis
2. Full information available on hover/tooltip
3. Layout doesn't break or overflow
4. Collapsed state handles long content appropriately

**Manual Steps**:
1. Mock user with long username (> 20 characters)
2. Mock user with long email address
3. Verify text truncation works properly
4. Test hover states show full information
5. Verify collapsed state handles long names
6. Check layout remains stable

## Automated Testing Commands

```bash
# Run all sidebar component tests
bun test apps/web/src/components/layout/sidebar.test.tsx

# Run sidebar context tests  
bun test apps/web/src/features/navigation/hooks/use-sidebar-state.test.ts

# Run role-based access control tests
bun test apps/web/src/components/layout/sidebar.auth.test.tsx

# Run integration tests
bun test apps/web/src/features/navigation/components/navigation-menu.test.tsx

# Run accessibility tests
bun test apps/web/src/components/layout/sidebar.a11y.test.tsx

# Type checking
bun run check-types

# Visual regression tests (if implemented)
bun test apps/web/tests/visual/sidebar.visual.test.ts
```

## Performance Validation

### Animation Performance
1. Open Chrome DevTools Performance tab
2. Trigger sidebar expand/collapse
3. Verify animations maintain 60fps
4. Check for layout thrashing or forced reflows

### Memory Usage
1. Open Chrome DevTools Memory tab
2. Interact with sidebar multiple times
3. Force garbage collection
4. Verify no memory leaks from event listeners

### Bundle Size Impact
```bash
# Check bundle size impact
bun run build
bun run analyze # if bundle analyzer configured
```

## Accessibility Testing

### Keyboard Navigation
1. Tab through sidebar navigation items
2. Verify focus indicators are visible
3. Test Enter/Space to activate items
4. Verify Escape key closes mobile sidebar

### Screen Reader Testing
1. Test with macOS VoiceOver or Windows NVDA
2. Verify sidebar is announced as navigation landmark
3. Check active item is announced properly
4. Verify state changes are announced

### Color Contrast
1. Verify navigation text meets WCAG AA standards
2. Test with browser high contrast mode
3. Check focus indicators have sufficient contrast