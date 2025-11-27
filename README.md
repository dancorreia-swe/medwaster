# medwaster

> 🇧🇷 **[Leia em Português](./README.pt-BR.md)**

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Elysia, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Elysia** - Type-safe, high-performance framework
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Email & password authentication with Better Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```
## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.
3. Apply the schema to your database:
```bash
bun db:push
```


Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
The API is running at [http://localhost:4000](http://localhost:4000).



## Project Structure

```
medwaster/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   ├── native/      # Mobile application (React Native, Expo)
│   └── server/      # Backend API (Elysia)
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:server`: Start only the server
- `bun check-types`: Check TypeScript types across all apps
- `bun dev:native`: Start the React Native/Expo development server
- `bun db:push`: Push schema changes to database
- `bun db:studio`: Open database studio UI

## Installation & Deployment

For detailed installation instructions, including environment configuration, self-hosting guides, and troubleshooting, please refer to the **[Installation Guide](./docs/INSTALLATION.md)**.

### Quick Start

1.  **Install Dependencies:**
    ```bash
    bun install
    ```

2.  **Setup Environment:**
    Copy `.env.example` to `.env` and configure your secrets (Database, Auth, OpenAI, etc.).
    *See [Environment Configuration](./docs/INSTALLATION.md#environment-configuration-env) for details.*

3.  **Start Services (Docker):
    ```bash
    docker compose up -d
    ```

4.  **Run Development Server:**
    ```bash
    bun dev
    ```

- **Web:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:4000](http://localhost:4000)

