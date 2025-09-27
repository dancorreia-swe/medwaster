# Tasks: Sidebar Layout with ShadCN Components

**Input**: Design documents from `/specs/001-sidebar-layout-using/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **MedWaster monorepo**: Web workspace only (`apps/web/src/`)
- **Components**: `apps/web/src/components/layout/`
- **Features**: `apps/web/src/features/navigation/`
- **Types**: `apps/web/src/types/`
- **Tests**: Colocated with `.test.ts` or `.test.tsx` suffix

## Phase 3.1: Setup
- [ ] T001 Create folder structure in apps/web/src for sidebar components and navigation feature
- [ ] T002 Install ShadCN UI sidebar component and related dependencies in web workspace
- [ ] T003 [P] Setup TypeScript types and interfaces from data-model.md in apps/web/src/types/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test for Sidebar component props and behavior in apps/web/src/components/layout/sidebar.test.tsx
- [ ] T005 [P] Contract test for SidebarContext provider and hooks in apps/web/src/features/navigation/hooks/use-sidebar-state.test.ts
- [ ] T006 [P] Authentication and role-based access tests in apps/web/src/components/layout/sidebar.auth.test.tsx
- [ ] T007 [P] Integration test for navigation functionality in apps/web/src/features/navigation/components/navigation-menu.test.tsx
- [ ] T008 [P] Responsive behavior and state persistence tests in apps/web/src/components/layout/sidebar.responsive.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 [P] Create UserProfile and NavigationItem type definitions in apps/web/src/types/user.types.ts
- [ ] T010 [P] Create navigation types and configuration in apps/web/src/types/navigation.types.ts
- [ ] T011 Implement SidebarContext with state management and localStorage persistence in apps/web/src/features/navigation/hooks/use-sidebar-state.ts
- [ ] T012 Create useSidebar hook for context consumption in apps/web/src/features/navigation/hooks/use-sidebar-state.ts
- [ ] T013 [P] Create base Sidebar component with expand/collapse functionality in apps/web/src/components/layout/sidebar.tsx
- [ ] T014 [P] Implement SidebarContent component for navigation items in apps/web/src/components/layout/sidebar-content.tsx
- [ ] T015 [P] Create SidebarFooter component for user profile display in apps/web/src/components/layout/sidebar-footer.tsx
- [ ] T016 [P] Build NavigationItem component with icon and routing in apps/web/src/features/navigation/components/navigation-item.tsx
- [ ] T017 Create NavigationMenu component orchestrating navigation items in apps/web/src/features/navigation/components/navigation-menu.tsx
- [ ] T018 Implement useLocalStorage utility hook in apps/web/src/lib/hooks/use-local-storage.ts

## Phase 3.4: Integration
- [ ] T019 Integrate SidebarContext provider at app root level
- [ ] T020 Connect navigation items with TanStack Router for active state management
- [ ] T021 Implement responsive behavior with CSS media queries and viewport detection
- [ ] T022 Add authentication state integration and role-based access control

## Phase 3.5: Polish
- [ ] T023 [P] Implement accessibility features (ARIA labels, keyboard navigation) in sidebar components
- [ ] T024 [P] Add smooth animations and transitions for expand/collapse states
- [ ] T025 [P] Optimize component re-renders with React.memo and useMemo where appropriate
- [ ] T026 Run comprehensive testing suite and fix any failing tests
- [ ] T027 Verify responsive behavior across all breakpoints (mobile, tablet, desktop)

## Dependencies
- Setup tasks (T001-T003) must complete before any other work
- All tests (T004-T008) before implementation (T009-T018)
- T011 (SidebarContext) blocks T012 (useSidebar hook)
- T009-T010 (types) block most implementation tasks
- T013 (base Sidebar) blocks T014-T015 (sidebar sub-components)
- T016 (NavigationItem) blocks T017 (NavigationMenu)
- T018 (localStorage hook) blocks T011 (context with persistence)
- Integration tasks (T019-T022) require completed core implementation
- Polish tasks (T023-T027) are parallel and can run after integration

## Parallel Example
```bash
# Launch T004-T008 together (Tests Phase):
Task: "Contract test for Sidebar component in apps/web/src/components/layout/sidebar.test.tsx"
Task: "Contract test for SidebarContext in apps/web/src/features/navigation/hooks/use-sidebar-state.test.ts"
Task: "Authentication tests in apps/web/src/components/layout/sidebar.auth.test.tsx"
Task: "Navigation integration test in apps/web/src/features/navigation/components/navigation-menu.test.tsx"
Task: "Responsive behavior tests in apps/web/src/components/layout/sidebar.responsive.test.tsx"

# Launch T013-T016 together (Core Components Phase):
Task: "Create base Sidebar component in apps/web/src/components/layout/sidebar.tsx"
Task: "Implement SidebarContent component in apps/web/src/components/layout/sidebar-content.tsx"
Task: "Create SidebarFooter component in apps/web/src/components/layout/sidebar-footer.tsx"
Task: "Build NavigationItem component in apps/web/src/features/navigation/components/navigation-item.tsx"

# Launch T023-T025 together (Polish Phase):
Task: "Implement accessibility features in sidebar components"
Task: "Add animations and transitions for sidebar states"
Task: "Optimize component performance with memoization"
```

## Notes
- [P] tasks = different files, no dependencies between them
- Verify all contract tests fail before implementing components
- Follow TDD: Red (failing test) → Green (minimal implementation) → Refactor
- Commit after each completed task for clear development history
- All components must support both admin and super-admin roles
- Responsive behavior should be handled primarily through CSS with JavaScript fallbacks
- State persistence must be robust and handle localStorage errors gracefully

## Task Generation Rules Applied
1. **From Contracts**: sidebar-component.md → T004, T013-T015; sidebar-context.md → T005, T011-T012
2. **From Data Model**: UserProfile/NavigationItem entities → T009-T010 type definitions
3. **From Research**: ShadCN integration → T002; responsive design → T021; authentication → T006, T022
4. **From Quickstart**: Test scenarios → T004-T008; manual testing requirements → T026-T027

## Validation Checklist
**GATE: All items must be checked before marking tasks complete**
- [ ] All contracts have corresponding test tasks (T004-T008)
- [ ] All entities have type definition tasks (T009-T010)
- [ ] All components identified in plan have implementation tasks (T013-T017)
- [ ] Integration requirements covered (T019-T022)
- [ ] Accessibility and performance requirements addressed (T023-T025)
- [ ] Authentication and role-based access implemented (T006, T022)
- [ ] Responsive behavior fully implemented (T008, T021, T027)
- [ ] State persistence functionality complete (T011, T018)