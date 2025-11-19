# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Medwaster is a full-stack educational platform built with TypeScript that includes:
- **Web application** (React + TanStack Router + Vite)
- **Mobile application** (React Native + Expo)
- **API server** (Elysia + Bun)
- **Database** (PostgreSQL + Drizzle ORM)

This is a Turborepo monorepo with feature-rich modules for questions, achievements, categories, tags, wiki articles, and AI-powered functionality.

## Common Development Commands

### Root Level Commands
```bash
# Install dependencies
bun install

# Start all apps in development
bun dev

# Start specific apps
bun dev:web        # Web app on port 3001
bun dev:server     # API server on port 3000
bun dev:native     # React Native/Expo
bun dev:worker     # Background worker

# Build all apps
bun build

# Type checking across all apps
bun check-types

# Testing
bun test
bun test:watch
bun test:ui
```

### Database Commands
```bash
# Database operations (all run on server)
bun db:start       # Start PostgreSQL with Docker
bun db:push        # Push schema changes to database
bun db:generate    # Generate migration files
bun db:migrate     # Apply migrations
bun db:studio      # Open Drizzle Studio
bun db:seed        # Seed database with initial data
bun db:reset       # Reset database
bun db:stop        # Stop Docker containers
bun db:down        # Stop and remove containers
```

### App-Specific Commands
```bash
# Web app (apps/web)
cd apps/web
bun dev            # Development server
bun build          # Production build
bun check-types    # TypeScript check
bun test           # Run Vitest tests

# Server (apps/server)  
cd apps/server
bun dev            # Development with hot reload
bun dev:worker     # Background worker
bun build          # Build for production
bun check-types    # TypeScript check
bun test           # Run Vitest tests
```

## Architecture

### Backend (apps/server)
- **Framework**: Elysia with Bun runtime
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with email/password
- **API Structure**: Modular approach with separate modules for each feature
- **Database Schema**: Located in `src/db/schema/` with separate files for each domain
- **Migrations**: Auto-generated in `src/db/migrations/`
- **Background Jobs**: BullMQ with Redis (see workers/)

### Frontend (apps/web)
- **Framework**: React 19 with TanStack Router
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4.0 with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Authentication**: Better Auth client integration
- **Form Handling**: TanStack Form with Zod validation

### Mobile (apps/native)
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for React Native)
- **Authentication**: Better Auth with Expo integration

### Key Features & Modules
- **Questions**: Multi-type question system (multiple choice, true/false, fill-in-blank, matching)
- **Categories & Tags**: Content organization with hierarchical categories
- **Wiki**: Article management with rich text editing (BlockNote/TipTap)
- **Achievements**: Gamification system with user progress tracking
- **AI Integration**: OpenAI integration for content generation and chat
- **Audit System**: Comprehensive logging and event tracking

## Database Schema Notes

The database uses PostgreSQL with Drizzle ORM. Key schemas:
- `questions.ts`: Complex question types with related options and answers
- `auth.ts`: User authentication and authorization (Better Auth)
- `achievements.ts`: Gamification and user progress
- `categories.ts`: Hierarchical content categorization
- `wiki.ts`: Article management with metadata
- `audit.ts`: System-wide event logging

## Development Environment Setup

1. Ensure PostgreSQL is running (use `bun db:start` for Docker)
2. Copy environment files and configure database connection
3. Run `bun db:push` to setup database schema
4. Run `bun db:seed` to populate initial data
5. Use `bun dev` to start all applications

## Testing

- **Web**: Vitest with React Testing Library
- **Server**: Vitest with custom test setup
- **Test Commands**: Use `bun test` (run once) or `bun test:watch` (watch mode)

## Type Safety

This project emphasizes type safety with:
- Strict TypeScript configuration across all apps
- Drizzle for type-safe database operations
- TanStack Router for type-safe routing
- Better Auth for type-safe authentication
- Eden for type-safe API client (Elysia to React)

## Important File Locations

- Database schema: `apps/server/src/db/schema/`
- API routes: `apps/server/src/modules/`
- Web routes: `apps/web/src/routes/`
- Shared UI components: `apps/web/src/components/ui/`
- Feature modules: `apps/web/src/features/`