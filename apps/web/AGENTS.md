Web agents guide
===============

Purpose
-------
This file documents conventions, important files, and a recommended feature scaffold for the apps/web front-end (Vite + React). It explains how routes, features, React Query, Eden/treaty, and better-auth are wired together.

Quick facts
-----------
- Framework: React + Vite
- Router: TanStack Router (file/folder mixed approach with routeTree.gen.ts)
- UI: shadcn-ui (components under src/components/ui)
- Auth: better-auth (client helpers in src/lib/auth-client.ts)
  - Documentation Reference: https://www.better-auth.com/docs
- Data fetching: React Query (@tanstack/react-query)
- Server bridge: @elysiajs/eden treaty client (src/lib/client.ts)

Important files
---------------
- src/main.tsx                 - Router + QueryClient providers bootstrapping
- src/routeTree.gen.ts         - generated route tree for TanStack Router
- src/routes/                  - route files (file+folder mix using createFileRoute)
- src/lib/client.ts            - treaty client that maps to server App type
- src/lib/auth-client.ts       - better-auth client helper used by auth components
- src/features/                - feature folders (see scaffold below)
- src/components/              - shared presentational components and shadcn wrappers
- src/components/ui/           - shadcn UI primitives

Routing
-------
- TanStack Router uses a file-based convention for many routes. The repo contains a generated `routeTree.gen.ts` which produces the route tree used by the RouterProvider in `main.tsx`.
- Routes can be nested in folders and files; follow the existing pattern in `src/routes`.

Frontend <-> Backend (Eden / treaty)
----------------------------------
- The frontend creates a typed treaty client in `src/lib/client.ts` using the server `App` type exported from the server (apps/server/src/index.ts).
- Use the treaty `client` to call endpoints in a typed manner. Example usage lives in `src/features/wiki/api/topics.ts` where the queryFn calls `client.wiki.private.get()`.

Auth
----
- `src/lib/auth-client.ts` exports an `authClient` created by `better-auth/react`. Use this in sign-in/sign-up components (already wired in `src/components/sign-in-form.tsx` and `sign-up-form.tsx`).

Data fetching (React Query)
---------------------------
- The app uses React Query for server state. Query options are typically declared as `queryOptions(...)` and consumed by the components via hooks like `useSuspenseQuery` or `useQuery`.
- Keep query options and query keys consistent across features to enable caching and refetch behaviors.

Feature folder conventions (recommended)
---------------------------------------
Each feature (domain) under `src/features/<feature>` should organize files like this:

- src/features/<feature>/
  - api/           -> treaty queryOptions, mutations and hooks (uses `client`)
  - components/    -> presentational and small container components consumed by routes
  - hooks/         -> feature-specific React hooks
  - types/         -> feature-specific types and zod schemas
  - index.ts       -> exports public parts of the feature

Example: wiki (already present)
- src/features/wiki/api/topics.ts uses the treaty `client` and exports `topicsQueryOptions` consumed in `src/features/wiki/components/topics.tsx` via `useSuspenseQuery`.

Feature API example (pattern)
-----------------------------
Example of a queryOptions file using treaty and React Query:

```ts
import { client } from "@/lib/client";
import { queryOptions } from "@tanstack/react-query";

export const topicsQueryOptions = queryOptions({
  queryKey: ["topics"],
  queryFn: () => client.wiki.private.get(),
});
```

Components
----------
- Shared UI building blocks live in `src/components/ui` (shadcn wrappers). Non-primitive components (sidebar, header, sign-in form) live in `src/components`.
- Keep components small and focused. Use the feature-level `components/` for feature-specific UI.

Routing and auth guarded routes
-------------------------------
- Protected routes follow the pattern in `src/routes/_auth/*`. Use the auth client and route structure to place guarded UI under that path.

Running the app
---------------
- From the repo root: bun run dev:web (this runs turbo -F web dev)
- From the web app: cd apps/web && bun run dev

Best practices
--------------
- Keep feature modules self-contained. Prefer feature-local hooks and components rather than large cross-feature coupling.
- Use treaty `client` for all server calls so you benefit from typed endpoints.
- Centralize query key names and queryOptions to make cache invalidation predictable.
- Keep route files focused on composing UI — heavy logic should live inside feature services/hooks.
- Use the generated `routeTree.gen.ts` and follow file/folder routing conventions to keep routes consistent.
