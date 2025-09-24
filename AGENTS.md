# Repository agents guide

## Purpose

This file gives a quick orientation for automated agents (or new contributors) that need to run, build, or interact with the monorepo.

## Layout

- Root: monorepo configured with Bun as the package manager (packageManager: "bun@1.2.20"). Workspaces are apps/_ and packages/_.
- apps/
  - server -> backend (Node/Bun, Elysia, Drizzle, Docker-compose for DB)
  - web -> frontend web app (Vite + React)
  - native -> mobile app (Expo / React Native)
- packages/ -> (currently not present in the repo). Add shared packages here when needed.

## Root scripts (package.json)

The root package.json exposes a set of turbo-powered convenience scripts. These orchestrate workspace-level tasks.

- dev : turbo dev (starts all dev targets according to turbo configuration)
- build : turbo build
- check-types : turbo check-types
- dev:native : turbo -F native dev (run dev only for the native app)
- dev:web : turbo -F web dev (run dev only for the web app)
- dev:server : turbo -F server dev (run dev only for the server)

## Database-related scripts (delegated to server workspace)

These root scripts forward to the server workspace, which contains the database/docker compose and drizzle tooling:

- db:push : turbo -F server db:push
- db:studio : turbo -F server db:studio
- db:generate : turbo -F server db:generate
- db:migrate : turbo -F server db:migrate
- db:start : turbo -F server db:start (runs docker compose up -d in apps/server)
- db:watch : turbo -F server db:watch
- db:stop : turbo -F server db:stop
- db:down : turbo -F server db:down

## Per-app quick commands

From the project root you can use the root scripts above, or run scripts directly inside each app by changing into the app directory.

Examples (using Bun):

- Start everything (recommended for local development):
  bun run dev

- Start only the web app:
  bun run dev:web
  or
  cd apps/web && bun run dev

- Start only the native app (Expo):
  bun run dev:native
  or
  cd apps/native && bun run dev

- Start only the server (backend):
  bun run dev:server
  or
  cd apps/server && bun run dev

- Start DB for local development:
  bun run db:start

## Notes and conventions

- The repo uses Turbo for workspace orchestration. The root scripts invoke turbo and target workspaces by name.
- packageManager is Bun; commands above show Bun usage but npm/yarn/pnpm users can run equivalent npm run <script> from the root or the specific workspace.
- The apps folder contains three primary apps: server (backend), web (frontend), native (mobile). The packages folder is reserved for shared packages but is currently not present.

When editing or running tasks, prefer running the scoped turbo tasks from the root so cached and parallel behavior is preserved.
