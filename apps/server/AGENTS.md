Server agents guide
===================

Purpose
-------
This file documents conventions, important files, and a recommended module scaffold for the apps/server Elysia application.

Quick facts
-----------
- Framework: Elysia (server)
- Runtime: Bun (root packageManager is bun@1.2.20)
- DB: Postgres via drizzle-orm
- Auth: better-auth with drizzle adapter and expo plugin
- Frontend bridge: Eden / treaty (frontend imports type App exported from apps/server/src/index.ts)

Important files
---------------
- src/index.ts                - root Elysia app, mounts modules and exports `type App = typeof app`
- src/lib/auth.ts             - better-auth configuration and Elysia macro that exposes an auth guard
- src/db/index.ts             - exports the drizzle db instance
- src/db/schema/*.ts          - drizzle table schema definitions
- src/modules/<domain>/       - feature modules organized per domain

Module conventions
------------------
- Location: src/modules/<domain>
- Files inside a domain folder:
  - index.ts   -> controller: an Elysia sub-app that defines routes and mounts guards
  - model.ts   -> types, DTOs and validation schemas
  - service.ts -> business logic implemented as an abstract class with static methods

Services
--------
Services should be stateless. Implement them as abstract classes with static methods so they can be called without instantiation.

Example service (replace placeholder drizzle calls with your schema objects):

```ts
import { db } from "../../db";
import { v4 as uuid } from "uuid";
import type { Todo } from "./model";

export abstract class TodoService {
  static async list(): Promise<Todo[]> {
    return await db.select().from("todo");
  }

  static async get(id: string): Promise<Todo | null> {
    const rows = await db.select().from("todo").where({ id });
    return rows[0] ?? null;
  }

  static async create(payload: { title: string }): Promise<Todo> {
    const id = uuid();
    const now = new Date();
    await db.insert("todo").values({ id, title: payload.title, completed: false, createdAt: now, updatedAt: now });
    return { id, title: payload.title, completed: false, createdAt: now, updatedAt: now } as Todo;
  }

  static async update(id: string, patch: Partial<Omit<Todo, "id">>): Promise<Todo | null> {
    await db.update("todo").set({ ...patch, updatedAt: new Date() }).where({ id });
    return this.get(id);
  }

  static async delete(id: string): Promise<void> {
    await db.delete("todo").where({ id });
  }
}
```

Controllers (index.ts)
----------------------
Controllers export an Elysia instance and typically mount route handlers that call service static methods. If the module requires authentication use `.guard({ auth: true }, ...)` as in the existing wiki module.

Example controller:

```ts
import Elysia from "elysia";
import { TodoService } from "./service";

export const todos = new Elysia({ prefix: "/todos" })
  .get("/", async () => await TodoService.list())
  .post("/", async ({ body }) => await TodoService.create(body as { title: string }))
  .get(":id", async ({ params: { id } }) => {
    const t = await TodoService.get(id as string);
    if (!t) return { status: 404 };
    return t;
  })
  .put(":id", async ({ params: { id }, body }) => await TodoService.update(id as string, body as any))
  .delete(":id", async ({ params: { id } }) => {
    await TodoService.delete(id as string);
    return { status: 204 };
  });
```

Models (model.ts)
-----------------
Keep types, DTOs and validation schemas in model.ts. You can use TypeScript types, InferModel from drizzle, or zod schemas. Keep mapping helpers here when you need to translate DB rows into API DTOs.

Wiring modules into the root app
-------------------------------
Export an Elysia sub-app from the module and mount it in src/index.ts with `.use(module)` or `.use(module)` and expose the app type for Eden/treaty:

```ts
import { todos } from "./modules/todos";

const app = new Elysia()
  .use(todos)
  .listen(3000);

export type App = typeof app;
```

Eden / treaty notes
-------------------
- The frontend uses treaty to create a typed client. Treaty's generic parameter should be the exported App type from this server (import type { App } from "@server/index").
- Keep route handler signatures and return types consistent so treaty can infer accurate types.

Running and scripts
-------------------
- Development (from repo root): bun run dev or bun run dev:server
- Database: bun run db:start / db:migrate / db:push (root scripts forward to server workspace)

Best practices
--------------
- Keep controllers thin and focused on request/response handling.
- Keep services stateless and implement them as abstract classes with static methods.
- Put validation in controllers or dedicated validators and return meaningful HTTP status codes.
- Keep model.ts focused on types and mapping logic.
