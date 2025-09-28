
# Implementation Plan: Password Recovery and Audit Logging

**Branch**: `002-complete-the-password` | **Date**: 2024-12-19 | **Spec**: `/specs/002-complete-the-password/spec.md`
**Input**: Feature specification from `/specs/002-complete-the-password/spec.md`

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
Complete password recovery functionality by implementing email service integration with the existing Better Auth setup and create a comprehensive audit logging system. This extends the current authentication foundation (RF005-RF006) by adding secure password reset capabilities and comprehensive security event tracking for compliance and monitoring.

## Technical Context
**Language/Version**: TypeScript 5.x, Node.js 20+ (Bun runtime)  
**Primary Dependencies**: Elysia, Better Auth, Drizzle ORM, React Email, Nodemailer  
**Storage**: PostgreSQL via Drizzle (extend existing auth schema)  
**Testing**: Bun test with email delivery mocking  
**Target Platform**: Server (Elysia) with email delivery integration
**Project Type**: Fullstack enhancement (server-focused with web admin interface)  
**Performance Goals**: <2s email delivery, <100ms audit log queries, 99.9% email delivery success  
**Constraints**: SMTP email service, medical compliance audit trail, GDPR compliance  
**Scale/Scope**: Support 1000+ users, 7-year audit retention, rate-limited password resets

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Monorepo Structure Compliance**:
- [x] Extends existing `apps/server` workspace (no new workspace needed)
- [x] Follows domain-driven organization in `modules/`, `db/schema/`, `emails/`
- [x] No violation of package separation

**TypeScript Standards**:
- [x] All code written in TypeScript with explicit types  
- [x] Extends existing auth schema for audit logs
- [x] Better Auth API boundaries already properly typed

**Build System Compliance**:
- [x] Works with existing Turbo configuration
- [x] Uses established database scripts for schema migrations
- [x] Dependencies added to `apps/server/package.json`

**Code Quality Standards**:
- [x] Follows existing server workspace conventions
- [x] Tests colocated with implementation modules
- [x] Email service endpoints include integration tests

**Environment Management**:
- [x] SMTP credentials via environment variables
- [x] Email service configuration externalized
- [x] Development SMTP server setup documented

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
# MedWaster Password Recovery & Audit Logging Extension
apps/
├── server/                           # Elysia API (PRIMARY WORKSPACE)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── auth.ts              # ✏️ MODIFY: Add sendResetPassword implementation
│   │   │   ├── email-service.ts     # ➕ NEW: Static EmailService class
│   │   │   └── rate-limiter.ts      # ➕ NEW: Static RateLimiter class
│   │   ├── modules/
│   │   │   └── audit/               # ➕ NEW: Audit module (follows questions pattern)
│   │   │       ├── index.ts         # Export audit controller
│   │   │       ├── audit.controller.ts  # Elysia instance as controller
│   │   │       ├── audit.service.ts     # Static AuditService class
│   │   │       ├── audit.queries.ts     # Database operations
│   │   │       └── audit.validators.ts  # Zod schemas + normalization
│   │   ├── db/
│   │   │   └── schema/
│   │   │       ├── auth.ts          # ✏️ MODIFY: Add password reset tokens
│   │   │       └── audit.ts         # ➕ NEW: Audit log schema
│   │   ├── emails/
│   │   │   └── auth/
│   │   │       └── forget-password.tsx # ✅ EXISTS: Already implemented
│   │   └── middleware/
│   │       └── audit.ts             # ➕ NEW: Audit logging middleware
│   └── package.json                 # ✏️ MODIFY: Add zod, nodemailer dependencies
├── web/                            # Admin interface (SECONDARY)
│   └── src/
│       ├── features/
│       │   └── admin/
│       │       └── audit-logs/      # ➕ NEW: Super admin audit log viewer
│       │           ├── index.tsx    # Audit log list component
│       │           ├── filters.tsx  # Search and filter controls
│       │           └── details.tsx  # Individual log entry details
│       └── routes/
│           └── admin/
│               └── audit-logs.tsx   # ➕ NEW: Audit log route
└── native/                         # No changes needed for this feature
    └── (unchanged)

.env.example                        # ✏️ MODIFY: Add SMTP configuration variables
```

**Structure Decision**: This feature follows the established questions module MVC pattern with:
- **Controller**: Elysia instance handling HTTP routing and validation
- **Service**: Static classes with business logic (EmailService, AuditService) 
- **Validators**: Zod schemas with normalization functions
- **Queries**: Complex database operations in separate files
- **Middleware**: Audit capture integrated with Elysia request lifecycle

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

**Output**: research.md with all NEEDS CLARIFICATION resolved ✅

## Phase 1: Design & Contracts  
*Prerequisites: research.md complete ✅*

1. **Extract entities from feature spec** → `data-model.md` ✅:
   - Password Reset Token entity with validation rules
   - Audit Log Entry entity with immutable properties  
   - Rate Limit Tracker entity for abuse prevention
   - Relationships documented with existing User/Session entities

2. **Generate API contracts** from functional requirements ✅:
   - Email Service API: password reset request/completion endpoints
   - Audit Log API: viewing, filtering, exporting endpoints
   - Internal interfaces for EmailService and AuditLogger
   - Output complete in `/contracts/` directory

3. **Generate contract tests** from contracts ✅:
   - Password reset flow tests (valid/invalid tokens, rate limiting)
   - Audit log API tests (authentication, filtering, exports)  
   - Email service integration tests (SMTP failures, template rendering)
   - All tests documented in contract files (to be implemented)

4. **Extract test scenarios** from user stories ✅:
   - Password recovery user journey with expected audit trail
   - Admin audit review workflow scenarios
   - Email delivery failure and retry scenarios
   - Rate limiting enforcement test cases

5. **Update agent file incrementally** → To be executed:
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
   - Add new dependencies: nodemailer, crypto-js, date-fns
   - Update recent changes with this feature
   - Preserve existing manual additions

**Output**: data-model.md ✅, /contracts/* ✅, failing tests (documented), quickstart.md ✅, agent-specific file (pending)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

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
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS  
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
