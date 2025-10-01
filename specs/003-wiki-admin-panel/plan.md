# Implementation Plan: Wiki Admin Panel

**Branch**: `003-wiki-admin-panel` | **Date**: 2025-01-26 | **Spec**: `/specs/003-wiki-admin-panel/spec.md`
**Input**: Feature specification from `/specs/003-wiki-admin-panel/spec.md`

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

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement comprehensive Wiki admin panel for managing educational content about medical waste disposal. This extends the current foundation by adding article management, category organization, rich text editing with BlockNote, publication workflow, and PDF export functionality. The system will serve as the content management backend for the student-facing wiki reference library, supporting both admins and super admins with complete CRUD operations and advanced content organization features.

## Technical Context
**Language/Version**: TypeScript 5.x, Node.js 20+ (Bun runtime)  
**Primary Dependencies**: React, ShadCN UI components, TanStack Router, Tailwind CSS (Frontend), Elysia, Better Auth, Drizzle ORM (Backend)  
**Storage**: PostgreSQL via Drizzle (extend existing schema with dedicated wiki tables), Local file storage with S3-extensible architecture  
**Editor**: BlockNote WYSIWYG editor (https://www.blocknotejs.org/docs/)  
**Export**: PDF generation capability for articles  
**Testing**: Bun test with component and API testing  
**Target Platform**: Web (Admin Panel)  
**Project Type**: Fullstack web application (extending existing monorepo)  
**Performance Goals**: <200ms page loads, <500ms search results, auto-save within 1s, PDF generation <5s  
**Constraints**: Must work with existing auth/RBAC system (admin + super-admin), mobile-responsive design, extensible file storage  
**Scale/Scope**: Support both admin levels, 1000+ articles, hierarchical content organization, PDF export functionality

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Monorepo Structure Compliance**:
✅ **PASS** - Adding to existing `apps/web` and `apps/server` structure
✅ **PASS** - Following established patterns in `features/wiki` directory
✅ **PASS** - Database schema follows existing `apps/server/src/db/schema` pattern
✅ **PASS** - API routes follow existing `apps/server/src/modules` structure

**Architecture Principles**:
✅ **PASS** - Extends existing Better Auth RBAC (admin role requirements)
✅ **PASS** - Uses established Drizzle ORM patterns for data persistence
✅ **PASS** - Follows React/TanStack Router patterns for frontend
✅ **PASS** - Leverages existing BlockNote editor integration

**Complexity Guidelines**:
⚠️ **REVIEW** - Rich text editor with image upload adds complexity
✅ **PASS** - Category hierarchy limited to 3 levels (manageable)
✅ **PASS** - Publication workflow has simple 3-state machine
✅ **PASS** - Search functionality uses database capabilities

**Dependencies**:
✅ **PASS** - BlockNote editor already integrated
✅ **PASS** - All UI components available via ShadCN
✅ **PASS** - Auth system supports required admin roles
✅ **PASS** - Database supports required relational patterns

**Performance Targets**:
✅ **PASS** - Realistic targets for typical content management operations
✅ **PASS** - Auto-save and search performance achievable with proper indexing
✅ **PASS** - Image handling can leverage existing file upload patterns

## Structure Decision
**Pattern**: Feature-based organization within existing monorepo
- **Frontend**: Extend `apps/web/src/features/wiki` with admin components
- **Backend**: Extend `apps/server/src/modules/wiki` with CRUD operations
- **Database**: Add wiki-specific tables to existing schema structure
- **Routing**: Use TanStack Router under `/_auth/admin/wiki/*` routes

## Phase 0: Research ✓
*Research complete - ready for Phase 1*

**BlockNote Integration Analysis**:
- ✅ BlockNote already configured with Portuguese locale
- ✅ ShadCN integration available via `@blocknote/shadcn`
- ✅ Slash commands and rich formatting supported
- ✅ Image upload capabilities available

**Database Schema Requirements**:
- ✅ Categories table exists (`content_categories`) - needs wiki type support
- ✅ Tags table exists (`tags`) - ready for wiki content
- ✅ Auth system supports admin role verification
- ⚠️ Need new `wiki_articles` table with proper relationships

**UI/UX Patterns**:
- ✅ Admin layout patterns established in existing codebase
- ✅ ShadCN components available for forms, tables, and modals
- ✅ Responsive design patterns consistent with existing pages

## Phase 1: Contracts & Design
*Ready for execution*

### Core Contracts Needed:
1. **Wiki Article API Contract** - CRUD operations for articles
2. **Category Management Contract** - Hierarchical category operations
3. **Rich Text Editor Contract** - BlockNote integration with image upload
4. **Publication Workflow Contract** - Status transitions and validation
5. **Search and Filter Contract** - Query interface for content discovery

### Data Model Extensions:
- New `wiki_articles` table with full content management fields
- Relationship tables for article-category and article-tag associations
- Reading time calculation and metadata storage
- Publication status tracking with audit trails

### UI Component Specifications:
- Article list/grid view with advanced filtering
- Rich text editor wrapper with custom blocks
- Category tree management interface
- Bulk operations modal and confirmation flows
- Publication status dashboard

## Phase 2 Planning: Task Generation Approach
*Will be executed by /tasks command*

**Task Organization Strategy**:
1. **Database Schema Tasks** - Create wiki tables and relationships
2. **Backend API Tasks** - Implement CRUD operations and business logic
3. **Frontend Component Tasks** - Build admin interface components
4. **Integration Tasks** - Connect frontend to backend with proper error handling
5. **Testing Tasks** - Unit tests for components and API endpoints
6. **Polish Tasks** - Performance optimization and user experience refinement

**Task Prioritization**:
- **P0 (Critical)**: Database schema, core CRUD operations
- **P1 (High)**: Article editor, category management, basic listing
- **P2 (Medium)**: Search/filter, bulk operations, publication workflow
- **P3 (Low)**: Advanced features, performance optimization, analytics

**Task Dependencies**:
- Database schema must be completed before API implementation
- Core API endpoints required before frontend integration
- Basic editor functionality needed before advanced features
- Search indexing should follow content creation capabilities

## Complexity Tracking
**Added Complexity Justified**:
- Rich text editor complexity offset by using existing BlockNote integration
- Category hierarchy complexity managed by 3-level limit
- Search functionality leverages PostgreSQL full-text capabilities
- Image upload builds on established file handling patterns

**Mitigation Strategies**:
- Incremental implementation starting with basic CRUD
- Extensive testing of editor integration
- Progressive enhancement for advanced features
- Clear error handling and validation at each layer

## Progress Tracking
- ✅ **Initial Constitution Check** - Passed with minor complexity review
- ✅ **Phase 0 Research** - BlockNote integration and database analysis complete
- 🔄 **Phase 1 Design** - Ready for contract definition and data modeling
- ⏳ **Post-Design Constitution Check** - Pending Phase 1 completion
- ⏳ **Phase 2 Task Generation** - Awaiting /tasks command
- ⏳ **Implementation** - Will follow task completion

---

**STATUS**: Ready for Phase 1 execution. Foundation research complete, technical context validated, complexity acceptable for incremental implementation.