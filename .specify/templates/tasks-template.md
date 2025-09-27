# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **MedWaster monorepo**: `apps/server/src/`, `apps/web/src/`, `apps/native/app/`
- **Server modules**: `apps/server/src/modules/[feature]/`
- **Web features**: `apps/web/src/features/[feature]/`
- **Native screens**: `apps/native/app/[feature]/`
- **Tests**: Colocated with `.test.ts` or `.test.tsx` suffix
- Paths shown below assume monorepo structure - adjust based on plan.md workspace selection

## Phase 3.1: Setup
- [ ] T001 Create feature structure per implementation plan in selected workspace(s)
- [ ] T002 Initialize TypeScript configuration and dependencies using Bun
- [ ] T003 [P] Configure workspace-specific linting and formatting

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test POST /api/[resource] in apps/server/src/modules/[feature]/[resource].test.ts
- [ ] T005 [P] Contract test GET /api/[resource]/{id} in apps/server/src/modules/[feature]/[resource].test.ts
- [ ] T006 [P] Integration test [user story] in apps/web/src/features/[feature]/[story].test.tsx
- [ ] T007 [P] Integration test [user flow] in apps/native/app/[feature]/[flow].test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T008 [P] [Entity] model with Drizzle schema in apps/server/src/modules/[feature]/schema.ts
- [ ] T009 [P] [Entity]Service CRUD operations in apps/server/src/modules/[feature]/service.ts
- [ ] T010 [P] React component in apps/web/src/features/[feature]/components/
- [ ] T011 POST /api/[resource] Elysia route in apps/server/src/routers/[feature].ts
- [ ] T012 GET /api/[resource]/{id} Elysia route in apps/server/src/routers/[feature].ts
- [ ] T013 Input validation using shared schemas
- [ ] T014 Error handling and logging

## Phase 3.4: Integration
- [ ] T015 Connect Service to Drizzle database
- [ ] T016 Authentication middleware (if needed)
- [ ] T017 Request/response logging with structured logs
- [ ] T018 CORS configuration for web client

## Phase 3.5: Polish
- [ ] T019 [P] Unit tests for validation in [workspace]/[feature]/validation.test.ts
- [ ] T020 Performance tests (API response times, component render)
- [ ] T021 [P] Update workspace documentation
- [ ] T022 Remove code duplication
- [ ] T023 Run smoke tests (`bun run dev`, `bun run check-types`)

## Dependencies
- Tests (T004-T007) before implementation (T008-T014)
- T008 blocks T009, T015
- T016 blocks T018
- Implementation before polish (T019-T023)

## Parallel Example
```
# Launch T004-T007 together:
Task: "Contract test POST /api/[resource] in apps/server/src/modules/[feature]/[resource].test.ts"
Task: "Contract test GET /api/[resource]/{id} in apps/server/src/modules/[feature]/[resource].test.ts"
Task: "Integration test [user story] in apps/web/src/features/[feature]/[story].test.tsx"
Task: "Integration test [user flow] in apps/native/app/[feature]/[flow].test.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task