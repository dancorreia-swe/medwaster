# MedWaster Installation & Configuration Guide

This guide provides detailed instructions for setting up, configuring, and deploying MedWaster.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration (.env)](#environment-configuration-env)
- [Deployment Modes](#deployment-modes)
- [Database Management](#database-management)
- [Mobile App Setup](#mobile-app-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- **Docker** & **Docker Compose** (v2.0+)
- **Bun** (optional, for local development outside Docker)
- **Git**

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/dancorreia-swe/medwaster/main/install.sh | bash
```

### Option 2: Manual Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dancorreia-swe/medwaster.git
    cd medwaster
    ```

2.  **Setup Environment:**
    ```bash
    cp .env.example .env
    ```

3.  **Configure `.env`** (See [Environment Configuration](#environment-configuration-env) below).

4.  **Start Services:**
    ```bash
    docker compose up -d
    ```

## Environment Configuration (.env)

The `.env` file is the central configuration for the entire stack. Below is a detailed reference for all available variables.

### 🔑 Critical Security Secrets
These **MUST** be changed for production.

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Secret key for JWT tokens and auth sessions. Generate with `openssl rand -base64 32`. |
| `AUDIT_CHECKSUM_SECRET` | Secret key to tamper-proof audit logs. Generate with `openssl rand -base64 32`. |
| `NODE_ENV` | Set to `production` for deployment, `development` for local work. |

### 🌐 Domain & Deployment Mode

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your domain name (e.g., `example.com`) or `localhost` for local dev. |
| `LETSENCRYPT_EMAIL` | Email for SSL certificate registration (required if using Proxy mode). |
| `LOCALAI_HOST` | Hostname for LocalAI if used (e.g., `medwaster.ai.lan`). |

### 🧠 AI Configuration (Easiest vs. Self-Hosted)

MedWaster supports multiple AI providers.

#### Option A: OpenAI (Easiest & Most Reliable)
The simplest way to get started.

| Variable | Value |
|----------|-------|
| `AI_PROVIDER` | `openai` |
| `OPENAI_API_KEY` | **[REQUIRED]** Your OpenAI API Key (`sk-...`). |
| `AI_CHAT_MODEL` | `gpt-4o` (Recommended) or `gpt-3.5-turbo`. |
| `AI_EMBEDDING_MODEL` | `text-embedding-3-small`. |
| `AI_TRANSCRIPTION_MODEL` | `whisper-1`. |

#### Option B: Ollama (Lightweight Self-Hosted)
Runs locally. Good for modern hardware.

1.  Start services: `docker compose --profile ollama --profile whisper up -d`
2.  Pull models: `docker exec -it medwaster-ollama ollama pull qwen3`

| Variable | Value |
|----------|-------|
| `AI_PROVIDER` | `ollama` |
| `OLLAMA_BASE_URL` | `http://ollama:11434/v1` |
| `AI_CHAT_MODEL` | `qwen3` (or `llama3.3`). **Do not** add `ollama:` prefix. |
| `AI_EMBEDDING_MODEL` | `nomic-embed-text` |

#### Option C: LocalAI (Heavy Self-Hosted)
For dedicated GPU servers.

| Variable | Value |
|----------|-------|
| `AI_PROVIDER` | `localai` |
| `LOCALAI_BASE_URL` | `http://localai:8080/v1` |

### 🔐 Authentication & OAuth
Configure external login providers.

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console Client ID for "Sign in with Google". |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console Client Secret. |

**Note:** For Google OAuth, ensure your redirect URI in Google Console matches: `${BETTER_AUTH_URL}/api/auth/callback/google`.

### 📧 Email (SMTP)
Required for password resets and notifications.

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | Your SMTP server (e.g., `smtp.gmail.com`). |
| `SMTP_PORT` | Port (usually `587` or `465`). |
| `SMTP_USER` | SMTP Username/Email. |
| `SMTP_PASS` | SMTP Password (use App Password for Gmail). |
| `SMTP_FROM_ADDRESS` | Sender email address. |

### 💾 Storage (MinIO/S3)
MedWaster includes MinIO for object storage (S3 compatible).

| Variable | Description |
|----------|-------------|
| `S3_ENDPOINT` | `http://minio:9000` (internal) or your S3 provider URL. |
| `MINIO_ROOT_USER` | Admin username for MinIO console. |
| `MINIO_ROOT_PASSWORD` | Admin password for MinIO console. |
| `S3_BUCKET_*` | Names for various storage buckets (questions, wiki, etc.). |

### 🗄️ Database (PostgreSQL)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connection string. Default: `postgresql://postgres:password@postgres:5432/medwaster`. |
| `POSTGRES_PASSWORD` | Database root password. **Change this for production.** |

### 🏗️ Infrastructure Ports
Ports exposed on the host machine.

| Variable | Default | Description |
|----------|---------|-------------|
| `WEB_HOST_PORT` | `3000` | Frontend access. |
| `SERVER_HOST_PORT` | `4000` | Backend API access. |
| `MINIO_CONSOLE_PORT` | `9001` | MinIO Admin UI. |

---

## Deployment Modes

### Mode 1: Direct Port (Simple / Local)
Great for testing. Access services directly via ports.

- **Start:** `docker compose up -d`
- **Web:** `http://localhost:3000`
- **API:** `http://localhost:4000`
- **Config:** Set `VITE_SERVER_URL=http://localhost:4000`

### Mode 2: Reverse Proxy (Production / HTTPS)
Uses Caddy to handle SSL and routing.

- **Start:** `docker compose --profile proxy up -d`
- **Web:** `https://yourdomain.com`
- **API:** `https://yourdomain.com/api`
- **Config:**
  - `DOMAIN=yourdomain.com`
  - `VITE_SERVER_URL=https://yourdomain.com/api`
  - `BETTER_AUTH_URL=https://yourdomain.com`

## Database Management

Migrations run automatically on startup. To manage manually:

```bash
# Run migrations
docker compose exec server bun run db:migrate

# Seed initial data (Admin user, etc.)
docker compose exec server bun run db:seed

# Open Database Studio (GUI)
docker compose exec server bun db:studio
```

**Initial Admin User:**
Configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

## Mobile App Setup

The mobile app (`apps/native`) uses Expo.

1.  Navigate to `apps/native`.
2.  Create `.env`:
    ```env
    EXPO_PUBLIC_SERVER_URL=https://yourdomain.com/api
    ```
3.  Run:
    ```bash
    bun install
    bun start
    ```

## Troubleshooting

-   **Services Unhealthy?** Check logs: `docker compose logs -f`.
-   **AI Errors?** Verify `OPENAI_API_KEY` or check if Ollama container is running.
-   **Email Fails?** Verify SMTP credentials. Gmail requires "App Passwords".
