# syntax=docker/dockerfile:1

# Prune stage - extract only what's needed for server
FROM oven/bun:1.3-alpine AS pruner
WORKDIR /app
COPY . .
RUN bun install -g turbo@2.6.1
RUN turbo prune server --docker

# Base stage (shared steps)
FROM oven/bun:1.3-alpine AS base
WORKDIR /app
COPY --from=pruner /app/out/json/ .
# Remove the pruned lockfile (it may be corrupted) and regenerate
RUN rm -f bun.lock

# Builder stage (Dev deps + Build)
FROM base AS builder
# Install ALL dependencies (including devDeps for building)
RUN bun install --no-optional
COPY --from=pruner /app/out/full/ .
WORKDIR /app/apps/server
RUN bun run build

# Production Deps stage (Prod deps only)
FROM base AS production-deps
# Install ONLY production dependencies
RUN bun install --production --no-optional

# Production stage
FROM oven/bun:1.3-alpine AS production

# Install Chromium (for Puppeteer) and curl (for healthcheck)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    dumb-init

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Copy prod node_modules
COPY --from=production-deps /app/node_modules ./node_modules

# Copy built artifacts and necessary config files
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/drizzle.config.ts ./apps/server/drizzle.config.ts
# Copy migrations if they exist (using wildcards to avoid error if dir doesn't exist, though it should)
COPY --from=builder /app/apps/server/src/db/migrations ./apps/server/src/db/migrations

WORKDIR /app/apps/server

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -u 1001 -G nodejs -s /bin/sh -D nodejs && \
    chown -R nodejs:nodejs /app

# Create uploads directory and set permissions
RUN mkdir -p /app/apps/server/uploads && \
    chown -R nodejs:nodejs /app/apps/server/uploads

USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Use dumb-init to handle signals correctly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start application
CMD ["bun", "run", "dist/index.js"]
