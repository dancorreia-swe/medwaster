# Gemini Context for Server Application

## Overview
This is the backend API for MedWaster, built with **ElysiaJS**. It follows a modular, feature-based architecture and uses **Drizzle ORM** for database interactions.

## Architecture
The application is structured around **Feature Modules**.

### Directory Structure
- **`src/modules/`**: Contains feature-specific code. Each folder (e.g., `users`, `auth`) typically contains:
  - `index.ts`: Defines the Elysia router/plugin, routes, and request handling.
  - `service.ts`: Contains business logic and database interactions (Service Layer).
  - `model.ts`: Defines DTOs, validation schemas, and types (usually TypeBox/Elysia types).
- **`src/db/`**: Database layer.
  - `schema/`: Drizzle schema definitions split by domain.
  - `index.ts`: Drizzle client instance and schema aggregation.
- **`src/lib/`**: Shared utilities (Auth, Error Handling, Common Responses).
- **`src/workers/`**: Background jobs using BullMQ.

### Key Patterns

#### 1. Module Definition
Each feature is an Elysia instance that is exported and mounted in the main app.
```typescript
// src/modules/example/index.ts
import { Elysia } from "elysia";

export const exampleModule = new Elysia({ prefix: "/example" })
  .get("/", () => "Hello World");
```

#### 2. Service Layer
Business logic is encapsulated in Service classes with static methods.
```typescript
// src/modules/example/service.ts
import { db } from "@/db";

export abstract class ExampleService {
  static async getAll() {
    return db.query.example.findMany();
  }
}
```

#### 3. Database Access
Use Drizzle ORM via the global `db` instance.
```typescript
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

// Querying
const user = await db.query.users.findFirst({
  where: eq(users.id, id)
});
```

## Key Commands

### Development
- **Start Dev Server**: `bun dev` (Runs `src/index.ts` with hot reload)
- **Start Worker**: `bun dev:worker`

### Database
- **Push Schema**: `bun db:push` (Push schema changes directly to DB - dev only)
- **Generate Migrations**: `bun db:generate`
- **Run Migrations**: `bun db:migrate`
- **Open Studio**: `bun db:studio` (GUI for database)
- **Seed Data**: `bun db:seed`
- **Reset DB**: `bun db:reset`

### Testing
- **Run Tests**: `bun test` (Vitest)

## Environment Variables
Ensure `.env` is configured with:
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string (for BullMQ).
- `BETTER_AUTH_SECRET`: Auth secret.
