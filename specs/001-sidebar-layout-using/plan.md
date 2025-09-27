
# Implementation Plan: Sidebar Layout with ShadCN Components

**Branch**: `001-sidebar-layout-using` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sidebar-layout-using/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Build a responsive sidebar navigation component using ShadCN library with minimize/expand functionality and user profile display at bottom. The sidebar will provide navigation to Dashboard, Questions, Wiki, and Profile sections with persistent state management and responsive behavior. Access is restricted to admin and super-admin users only - regular users cannot access the web application.

## Technical Context
**Language/Version**: TypeScript 5.x, Node.js 20+ (Bun runtime)  
**Primary Dependencies**: React, ShadCN UI components, TanStack Router, Tailwind CSS  
**Storage**: Local storage for sidebar state persistence, Context API for state management  
**Testing**: React Testing Library, Bun test  
**Target Platform**: Web (Vite)
**Project Type**: web - frontend only component  
**Performance Goals**: Smooth animations (<16ms frame time), instant state persistence  
**Constraints**: Mobile-first responsive design, accessibility compliance  
**Scale/Scope**: Single-user interface component, 4 navigation items, 3 responsive breakpoints

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Monorepo Structure Compliance**:
- [x] New workspace belongs in appropriate `apps/*` directory (apps/web)
- [x] Domain-driven folder organization maintained (components/features structure)
- [x] No violation of package separation (apps vs packages)

**TypeScript Standards**:
- [x] All code written in TypeScript with explicit types
- [x] Shared schemas reused across workspaces where applicable (user profile types)
- [x] API boundaries have proper type definitions (component props)

**Build System Compliance**:
- [x] Turbo configuration supports both unified and scoped builds
- [x] Database scripts follow established patterns (N/A for frontend-only)
- [x] Dependencies properly declared in workspace package.json

**Code Quality Standards**:
- [x] Follows workspace formatting conventions (web workspace tabs)
- [x] Test colocation strategy defined (.test.tsx files)
- [x] API endpoints include smoke test strategy (N/A for frontend-only)

**Environment Management**:
- [x] No secrets in code or configuration
- [x] Environment variables properly defined (N/A for frontend component)
- [x] Development environment setup documented

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# MedWaster Monorepo - Sidebar Feature
apps/
├── web/                    # Vite React client (PRIMARY TARGET)
│   └── src/
│       ├── components/     # UI primitives
│       │   ├── ui/         # ShadCN components
│       │   │   └── sidebar.tsx  # ShadCN sidebar primitive
│       │   └── layout/     # Layout components
│       │       ├── sidebar.tsx           # Main sidebar component
│       │       ├── sidebar-content.tsx   # Navigation content
│       │       ├── sidebar-footer.tsx    # User profile section
│       │       └── sidebar-context.tsx   # State management
│       ├── features/       # Feature modules
│       │   └── navigation/ # Navigation feature
│       │       ├── components/
│       │       │   ├── navigation-item.tsx
│       │       │   └── navigation-menu.tsx
│       │       ├── hooks/
│       │       │   └── use-sidebar-state.ts
│       │       └── types/
│       │           └── navigation.types.ts
│       ├── lib/            # Utilities
│       │   ├── utils.ts    # Tailwind utilities
│       │   └── hooks/      # Shared hooks
│       │       └── use-local-storage.ts
│       └── types/          # Global types
│           └── user.types.ts
└── server/                 # No changes needed for this feature
└── native/                 # No changes needed for this feature

packages/                   # No new shared libraries needed
```

**Structure Decision**: This feature targets the web workspace exclusively, following the apps/web/src structure with components organized by domain (layout, navigation) and reusable primitives in components/ui. The sidebar state management will be co-located with the components for optimal maintainability.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base template
- Generate setup tasks for ShadCN sidebar component installation and TypeScript configuration
- Create component test tasks from contracts (sidebar-component.md, sidebar-context.md)
- Generate implementation tasks for each component (sidebar, sidebar-context, navigation items)
- Add integration tasks for routing and responsive behavior
- Include polish tasks for accessibility, animations, and documentation

**Component-Based Task Breakdown**:
- **Setup Phase**: ShadCN installation, TypeScript types, project structure
- **Test Phase**: Component contracts → test files (sidebar.test.tsx, sidebar-context.test.tsx)
- **Core Phase**: Implementation tasks for each component and hook
- **Integration Phase**: Router integration, responsive behavior, state persistence
- **Polish Phase**: Accessibility testing, animation optimization, documentation

**Ordering Strategy**:
- TDD order: All contract tests before any implementation
- Dependency order: Context → Base component → Navigation components → Integration
- Mark [P] for parallel execution where components are independent
- Sequential tasks for shared files or dependent functionality

**Estimated Task Count**: 18-22 tasks
- Setup: 3 tasks
- Tests: 5 tasks [P] (different test files)
- Core Implementation: 8 tasks (some [P] for independent components)
- Integration: 4 tasks (sequential due to dependencies)
- Polish: 3 tasks [P] (independent optimization work)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
