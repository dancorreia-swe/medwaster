# Repository Guidelines

## Project Structure & Module Organization

- Bun + Turbo monorepo; active workspaces live in `apps/*`; `packages/` is reserved for shared libraries.
- `apps/server/src` runs the Elysia API with domain folders in `modules/`, `routers/`, `emails/`, plus Drizzle config in `db/`.
- `apps/web/src` hosts the Vite React client: primitives in `components/`, features in `features/`, routes generated under `routes/` and `routeTree.gen.ts`.
- `apps/native` contains the Expo client; screens live in `app/`, shared helpers in `lib/`, assets in `assets/`.

## Build, Test, and Development Commands

- `bun run dev` starts the Turbo graph, launching server, web, and native targets together.
- `bun run dev:web`, `dev:server`, or `dev:native` scope work to one app; the same scripts run inside each workspace.
- `bun run build` executes Turbo builds; run the command from a workspace for a focused build only.
- `bun run check-types` aggregates TypeScript checks across apps and should pass before pushing.
- Database scripts: `bun run db:start` for Docker, `db:migrate` for schema changes, `db:down` to clean up containers.

## Coding Style & Naming Conventions

- TypeScript everywhere; add explicit types at API boundaries and reuse shared schemas like `auth-schema.ts`.
- Match local formatting: backend files use two-space indentation, web/native sources keep their tab-based defaults.
- Apply PascalCase to React components, camelCase to variables and functions, and kebab-case to files and directories.

## Testing Guidelines

- No automated tests ship yet; rely on `bun run check-types` and manual verification in the running apps.
- Smoke-test the API with `curl http://localhost:3000` (server running) before submitting backend changes.
- Colocate new tests beside source files using `.test.ts` or `.test.tsx` naming so Turbo can discover them later.

## Commit & Pull Request Guidelines

- Follow Conventional Commits (`feat: add waste audit form`, `fix: correct db url`) as in current history.
- Keep commits focused and include generated artifacts (such as Drizzle output) when they are required.
- Describe PR intent, list verification steps (`dev`, `check-types`, migrations), and include UI evidence when relevant; note environment prerequisites for reviewers.

## Environment & Configuration

- Backend expects `DATABASE_URL` and `CORS_ORIGIN` in a local `.env`; keep secrets out of git.
- Manage database containers with `bun run db:start` and shut them down via `bun run db:down` when finished.
