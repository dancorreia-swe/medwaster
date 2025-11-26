# MedWaster Project Context

## Project Overview

**MedWaster** is a comprehensive medical waste management and gamification platform. It is a monorepo built using the **Better-T-Stack**, utilizing modern TypeScript technologies for full-stack development.

The project consists of three main applications:

- **`apps/server`**: A backend API built with **ElysiaJS**, utilizing **Drizzle ORM** with **PostgreSQL** and **Redis** (via BullMQ).
- **`apps/web`**: A frontend web application built with **React**, **Vite**, and **TanStack Router**.
- **`apps/native`**: A mobile application built with **React Native** and **Expo**, using **Expo Router** and **NativeWind**.

The project is managed as a monorepo using **TurboRepo** and **Bun**.

## Building and Running

### Prerequisites

- **Bun**: The project uses Bun as the package manager and runtime.
- **Docker & Docker Compose**: Required for running the database (PostgreSQL), Redis, MinIO, and optional AI services.
- **Node.js**: Required for some ecosystem tools (though Bun is the primary runtime).

### Setup

1.  **Install Dependencies**:
    ```bash
    bun install
    ```
2.  **Environment Configuration**:
    - Copy `.env.example` to `.env` in the root and `apps/*` directories.
    - Configure the necessary secrets (DB credentials, API keys, etc.).
3.  **Database Setup**:
    Ensure Docker is running, then start the infrastructure:
    ```bash
    docker compose up -d
    ```
    Push the schema to the database:
    ```bash
    bun db:push
    ```

### Key Commands

**Root Level (TurboRepo)**

- `bun dev`: Start all applications (Web, Server, Worker) in development mode.
- `bun build`: Build all applications.
- `bun check-types`: Run TypeScript type checking across the monorepo.
- `bun test`: Run tests using Vitest across the monorepo.

**Server (`apps/server`)**

- `bun dev:server`: Start the API server in dev mode.
- `bun dev:worker`: Start the background worker.
- `bun db:studio`: Open Drizzle Studio to view/edit database content.
- `bun db:generate`: Generate SQL migrations from schema changes.
- `bun db:migrate`: Apply pending migrations.

**Web (`apps/web`)**

- `bun dev:web`: Start the web application dev server (Vite).
- `bun build`: Build the web application for production.

**Native (`apps/native`)**

- `bun dev:native`: Start the Expo development server.
- `bun android` / `bun ios`: Run on Android/iOS emulators or devices.

## Development Conventions

### Architecture

- **Monorepo**: Code is shared and managed via TurboRepo workspaces (`apps/*`).
- **Routing**: Both Web and Native apps use file-based routing (TanStack Router for Web, Expo Router for Native).
- **Styling**: **Tailwind CSS** is used for the Web, and **NativeWind** allows using Tailwind classes in React Native.

### Tech Stack

- **Backend Framework**: ElysiaJS (High-performance TypeScript framework).
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM (TypeScript-first).
- **State Management**: TanStack Query (React Query) for async state and data fetching.
- **Authentication**: Better Auth.
- **Job Queue**: BullMQ (Redis-based).

### Testing

- **Framework**: **Vitest** is the primary testing framework for unit and integration tests.
- Run tests via `bun test` at the root or within specific app directories.

### Deployment

- **Docker**: The project includes a `docker-compose.yml` for orchestrating the entire stack (API, Web, DB, Redis, MinIO, LocalAI).
- **Profiles**: Docker Compose supports profiles like `proxy` (Caddy) and `ai` (LocalAI).

### Research and Documentation

Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.
