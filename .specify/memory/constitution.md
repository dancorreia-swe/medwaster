<!--
Sync Impact Report:
Version change: [NEW] → 1.0.0
Added principles: Monorepo Structure, TypeScript Everywhere, Build System Discipline, Code Quality Standards, Environment Management
Templates requiring updates: ✅ updated
Follow-up TODOs: None
-->

# MedWaster Constitution

## Core Principles

### I. Monorepo Structure
Active workspaces MUST live in `apps/*` with `packages/` reserved for shared libraries. Each workspace MUST be independently buildable and follow domain-driven organization:
- `apps/server/src`: Elysia API with domain folders in `modules/`, `routers/`, `emails/`, plus Drizzle config in `db/`
- `apps/web/src`: Vite React client with primitives in `components/`, features in `features/`, routes generated under `routes/`
- `apps/native`: Expo client with screens in `app/`, shared helpers in `lib/`, assets in `assets/`

Rationale: Clear separation enables independent development while maintaining shared infrastructure and reduces coupling between applications.

### II. TypeScript Everywhere (NON-NEGOTIABLE)
All code MUST be written in TypeScript with explicit types at API boundaries. Shared schemas like `auth-schema.ts` MUST be reused across workspaces. Type checking MUST pass via `bun run check-types` before any code submission.

Rationale: Type safety prevents runtime errors, improves maintainability, and enables better tooling across the monorepo.

### III. Build System Discipline
Turbo MUST be used for all build operations. Development workflow MUST support both unified (`bun run dev`) and scoped execution (`dev:web`, `dev:server`, `dev:native`). Database operations MUST use provided scripts (`db:start`, `db:migrate`, `db:down`) for consistency.

Rationale: Standardized build processes ensure reproducible environments and efficient development workflows.

### IV. Code Quality Standards
Code formatting MUST match workspace conventions: backend files use two-space indentation, web/native sources keep tab-based defaults. Naming MUST follow conventions: PascalCase for React components, camelCase for variables/functions, kebab-case for files/directories.

Testing MUST be colocated using `.test.ts` or `.test.tsx` naming. Manual verification MUST include API smoke-testing via `curl http://localhost:3000` for backend changes.

Rationale: Consistent formatting and testing conventions reduce cognitive load and improve code maintainability.

### V. Environment Management
Secrets MUST be kept out of git. Backend MUST expect `DATABASE_URL` and `CORS_ORIGIN` in local `.env`. Database containers MUST be managed through provided scripts to ensure consistent development environments.

Rationale: Proper environment management prevents security issues and ensures consistent development experiences.

## Development Workflow

All commits MUST follow Conventional Commits format (`feat: add waste audit form`, `fix: correct db url`). Commits MUST be focused and include generated artifacts (such as Drizzle output) when required.

Pull requests MUST describe intent, list verification steps (`dev`, `check-types`, migrations), and include UI evidence when relevant. Environment prerequisites MUST be noted for reviewers.

## Technology Standards

The stack is built on Bun + Turbo monorepo architecture with:
- Server: Elysia API with Drizzle ORM
- Web: Vite + React with TanStack Router
- Native: Expo React Native
- Database: Managed via Docker containers
- Build system: Turbo for orchestration

Changes to core technology choices require constitutional amendment.

## Governance

This constitution supersedes all other development practices and guidelines. All PRs and code reviews MUST verify compliance with these principles.

Amendments require:
1. Documentation of rationale and impact
2. Update of all dependent templates and guidelines
3. Migration plan for existing code (if applicable)
4. Team consensus on the change

Complexity MUST be justified against simplicity principles. When in doubt, refer to the AGENTS.md files in each workspace for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2024-12-19 | **Last Amended**: 2024-12-19