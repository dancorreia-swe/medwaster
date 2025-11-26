# medwaster

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

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
The API is running at [http://localhost:3000](http://localhost:3000).



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

## Self-Hosting / Deployment

MedWaster can be self-hosted using Docker Compose in two modes: **Direct Port Mode** (simple) or **Reverse Proxy Mode** (production with automatic HTTPS).

### Prerequisites

- Docker and Docker Compose installed
- Domain name (for reverse proxy mode with SSL)
- SMTP server credentials for email functionality
- OpenAI API key or LocalAI instance for AI features

### Quick Start

#### Option 1: Automated Script (Recommended)

Download and run the automated setup script:

```bash
# Install directly via curl
curl -fsSL https://raw.githubusercontent.com/dancorreia-swe/medwaster/main/install.sh | bash

# Or if you've cloned the repository
./install.sh
```

This script will download the latest `docker-compose.yml` and prepare the environment.

#### Option 2: Manual Setup

1. **Clone and configure environment**

```bash
git clone <repository-url>
cd medwaster
cp .env.example .env
```

2. **Edit `.env` file**

Required values to configure:
- `BETTER_AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `OPENAI_API_KEY` - Your OpenAI API key (or configure LocalAI)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Your SMTP credentials
- `AUDIT_CHECKSUM_SECRET` - Generate with: `openssl rand -base64 32`
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_ACCESS_KEY` - MinIO/S3 connection (defaults map to bundled MinIO)
- Bucket names per service: `S3_BUCKET_QUESTIONS`, `S3_BUCKET_WIKI`, `S3_BUCKET_AVATARS`, `S3_BUCKET_ACHIEVEMENTS`, `S3_BUCKET_CERTIFICATES`
- Optional self-hosted AI: `AI_PROVIDER=localai`, `LOCALAI_BASE_URL=http://localai:8080/v1`, `LOCALAI_API_KEY` (if set)

3. **Choose your deployment mode**

### Mode 1: Direct Port Access (Simple)

Best for: Local development, testing, or simple self-hosting

```bash
# Start all services
docker compose up -d

# Optional: start LocalAI (self-hosted OpenAI-compatible API)
docker compose --profile ai up -d localai

# Check status
docker compose ps

# View logs
docker compose logs -f
```

**Access:**
- Web App: http://localhost:3000
- API: http://localhost:4000
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432

**Configuration in `.env`:**
```env
DOMAIN=localhost
BETTER_AUTH_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:3000
VITE_SERVER_URL=http://localhost:4000
```

### Mode 2: Reverse Proxy with Caddy (Production)

Best for: Production deployments with automatic HTTPS

```bash
# Start all services including Caddy reverse proxy
docker compose --profile proxy up -d
```

**Access:**
- Everything: https://yourdomain.com
- API: https://yourdomain.com/api

**Configuration in `.env`:**
```env
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com
BETTER_AUTH_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
VITE_SERVER_URL=https://yourdomain.com/api
```

**Note:** Make sure your domain's DNS A record points to your server's IP address before starting. Caddy will automatically obtain and renew Let's Encrypt SSL certificates.

### Services Included

The Docker Compose setup includes:

**Infrastructure:**
- PostgreSQL 18 with pgvector extension (vector database for AI)
- Redis (caching and job queue)
- MinIO (S3-compatible object storage)
- LocalAI (optional, self-hosted OpenAI-compatible API on profile `ai`)

**Applications:**
- Server API (Elysia backend on port 4000)
- Server Worker (background job processing)
- Web Frontend (React SPA on port 3000)

**Optional (with `--profile proxy`):**
- Caddy (reverse proxy with automatic HTTPS)
- LocalAI (OpenAI-compatible API; enable with `--profile ai`)

### Using LocalAI (self-hosted AI)

1) Download or place GGUF models into `./localai/models` (mounted into the LocalAI container).  
2) Set in `.env`:  
   - `AI_PROVIDER=localai`  
   - `LOCALAI_BASE_URL=http://localai:8080/v1` (default matches docker-compose)  
   - `LOCALAI_API_KEY=` (only if you configure one in LocalAI)  
3) Start the LocalAI container: `docker compose --profile ai up -d localai`  
4) Keep `OPENAI_API_KEY` unset/empty when using LocalAI to avoid sending traffic to OpenAI.

**Add models on the fly:** pick a GGUF URL from the LocalAI model docs and run:
```bash
docker compose --profile ai exec localai sh -c "cd /models && curl -L <model-url> -o <model-name>.gguf"
```
Restart LocalAI if you add new files after the container is already running.

**Preloaded gallery models:** the `localai` service now preloads a chat model (`phi-2`), an embedding model (`bert-embeddings`), and Whisper (`whisper-1`) from the LocalAI gallery on startup. Override by setting `PRELOAD_MODELS` in your `.env` with a JSON array matching the LocalAI docs if you want different defaults.

See the LocalAI model guide for URLs and options: https://localai.io/models/ .

Example downloads (replace with the model you want):
```bash
# Small chat model (Phi-2 chat 2.7B Q4_0)
docker compose --profile ai exec localai sh -c \
  "cd /models && curl -L https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_0.gguf -o phi-2.Q4_0.gguf"

# Instruction-tuned LLaMA 2 7B (Q4_K_M)
docker compose --profile ai exec localai sh -c \
  "cd /models && curl -L https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf -o llama-2-7b-chat.Q4_K_M.gguf"
```

### Database Migrations

Run database migrations after first start:

```bash
# Run migrations
docker compose exec server bun run db:migrate

# Optional: Seed database with sample data
docker compose exec server bun run db:seed
```

### Mobile App Deployment

The mobile app (`apps/native`) is deployed separately using Expo:

```bash
cd apps/native

# Configure your backend URL
echo "EXPO_PUBLIC_SERVER_URL=https://yourdomain.com/api" > .env

# Build and submit to app stores
npx eas build --platform all
npx eas submit --platform all
```

For more details, see [Expo EAS documentation](https://docs.expo.dev/eas/).

### Updating Your Deployment

```bash
# Pull latest changes
git pull

# Rebuild and restart containers
docker compose build
docker compose up -d

# Or for proxy mode
docker compose --profile proxy build
docker compose --profile proxy up -d
```

### Monitoring and Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f server
docker compose logs -f web
docker compose logs -f server-worker

# Check health status
docker compose ps
```

### Backup and Restore

**Backup:**
```bash
# Backup database
docker compose exec postgres pg_dump -U postgres medwaster > backup.sql

# Backup MinIO data (object storage)
docker compose exec minio mc mirror /data ./minio-backup
```

**Restore:**
```bash
# Restore database
cat backup.sql | docker compose exec -T postgres psql -U postgres medwaster

# Restore MinIO data
docker compose exec minio mc mirror ./minio-backup /data
```

### Troubleshooting

**Services not starting:**
- Check logs: `docker compose logs`
- Verify environment variables in `.env`
- Ensure ports are not in use: `netstat -tuln | grep -E '(3000|4000|5432|6379|9000)'`

**Database connection issues:**
- Wait for PostgreSQL to be ready (check health: `docker compose ps`)
- Verify `DATABASE_URL` in `.env`

**AI features not working:**
- Verify `OPENAI_API_KEY` is set correctly
- Or configure LocalAI endpoint

**Email not sending:**
- Verify SMTP credentials in `.env`
- Check server logs: `docker compose logs server`

For more help, open an issue on GitHub.
