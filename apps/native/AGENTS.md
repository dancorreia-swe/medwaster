Native (Expo) agents guide
==========================

Purpose
-------
This file documents conventions, important files, and recommended feature structure for the apps/native Expo + React Native application. It mirrors the style used for web and server AGENTS files and focuses on routing (expo-router), styling (nativewind), auth (better-auth expo), and data fetching (React Query).

Quick facts
-----------
- Framework: Expo + React Native (expo-router)
- Routing: expo-router (file-based routing under app/)
- Styling: nativewind (Tailwind CSS for React Native)
- Auth: better-auth with @better-auth/expo client + expo-secure-store
- Data fetching: React Query (@tanstack/react-query)
- Entry: expo-router/entry (package.json main)

Important files and folders
---------------------------
- app/                        - expo-router routes and layout files (file-based routing)
- components/                 - shared presentational components used across the app
- lib/                        - clients, utilities and platform helpers (auth-client, constants)
- app/_layout.tsx             - root layout for the app (status bar, providers)
- babel.config.js             - includes nativewind and expo presets
- metro.config.js             - customized to work inside a monorepo and with nativewind
- global.css / tailwind.config.js - nativewind configuration and CSS tokens
- .env / .env.example         - environment variables used by the app
- package.json                - scripts: dev, android, ios, web

Routing (expo-router)
----------------------
- Routes live in the app/ folder using expo-router's file-based conventions. Layouts and nested routes are supported via folder structure.
- Use `Link`, `Stack`, `Tabs`, and `Drawer` from `expo-router` for navigation as shown in the existing app/ files.

Styling (nativewind)
---------------------
- nativewind provides tailwind-style classes for React Native. The project includes:
  - babel.config.js with nativewind/babel preset
  - tailwind.config.js & nativewind env types
  - global.css for shared styles
- Keep styles as utility classes in components and use small wrappers for repeated patterns.

Auth (better-auth, expo)
-------------------------
- The native app uses `better-auth` together with `@better-auth/expo` and `expo-secure-store` for storing tokens.
- `src/lib/auth-client.ts` (apps/native/lib/auth-client.ts) creates an auth client via `createAuthClient({ baseURL, expoClient({ store: SecureStore }) })`.
- Use `authClient.useSession()` or `authClient` hooks in components to get session state, call `authClient.signIn.email()` / `authClient.signUp.email()` and `authClient.signOut()`.

Data fetching (React Query)
---------------------------
- The app uses React Query for server state. Use `useQuery`, `useMutation`, or `useSuspenseQuery` as appropriate.
- For typed server calls, consider adding a treaty client (same approach as the web) to gain typed endpoint helpers. Currently auth is handled by `authClient` while other API calls can be implemented with fetch or a treaty client.

Feature folder conventions (recommended)
---------------------------------------
Organize platform features similarly to web, but tuned for mobile:

- src/features/<feature>/
  - api/          -> data access (React Query hooks, treaty client usage or fetch wrappers)
  - components/   -> feature presentational components optimized for mobile
  - hooks/        -> feature-specific hooks
  - screens/      -> screen components to be used directly in app/ routes
  - types/        -> feature types and validation schemas
  - index.ts      -> exports the feature public API

Example: authentication
- UI components live in `components/` (SignIn, SignUp). These use `authClient` from `lib/auth-client.ts` to sign in/out and access session state.

Metro / Monorepo notes
----------------------
- `metro.config.js` has been adapted to work inside a monorepo and to include nativewind. If you add packages in the root `packages/` folder, update metro to include them as watch folders.

Running the app
---------------
- From repo root: bun run dev:native (runs `turbo -F native dev`) — recommended so turbo orchestrates the workspace.
- Or, from the native app folder: cd apps/native && bun run dev (which runs `expo start --clear`).
- To run on device/emulator: bun run android | bun run ios from apps/native.

Best practices
--------------
- Keep screens small and delegate complex logic to feature hooks or services.
- Reuse components across platforms where possible; use platform-specific files (e.g., Component.native.tsx / Component.web.tsx) when necessary.
- Keep auth interactions centralized in `lib/auth-client.ts` and use hooks (e.g., `useSession`) for UI logic.
- Consider creating a treaty client similar to web if you want typed API calls from native; this helps keep parity between clients.
- Keep nativewind usage simple: prefer utility classes in JSX instead of large inline styles.
