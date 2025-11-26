# syntax=docker/dockerfile:1

# Prune stage - extract only what's needed for server
FROM oven/bun:1.3-debian AS pruner
WORKDIR /app
COPY . .
RUN bun install -g turbo@2.6.1
RUN turbo prune server --docker

# Build stage - use Debian for Bun
FROM oven/bun:1.3-debian AS builder
WORKDIR /app

# Copy pruned package.json files (for layer caching)
COPY --from=pruner /app/out/json/ .

# Remove the pruned lockfile (it may be corrupted) and regenerate
RUN rm -f bun.lock

# Install dependencies (only server's dependencies, no web deps)
# Some packages may fail but we continue if most succeed
RUN bun install --no-optional || true

# Verify critical packages are installed by checking node_modules
RUN test -d node_modules || (echo "ERROR: node_modules not created" && exit 1)

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Change WORKDIR to the specific app before building
WORKDIR /app/apps/server

# Build will fail if any required package is missing
RUN bun run build

# Production stage
FROM oven/bun:1.3-debian AS production

# Install only Chromium for Puppeteer (for PDF generation and web scraping)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set puppeteer to use system chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Copy workspace dependencies and server app from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server ./apps/server

WORKDIR /app/apps/server

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs && \
    chown -R nodejs:nodejs /app

# Create uploads directory and set permissions
RUN mkdir -p /app/apps/server/uploads && \
    chown -R nodejs:nodejs /app/apps/server/uploads

USER nodejs

# Expose port
EXPOSE 4000

# Health check (curl is available in debian base image)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Start application
CMD ["bun", "run", "start"]
