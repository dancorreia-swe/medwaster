# syntax=docker/dockerfile:1

# Prune stage - extract only what's needed for web
FROM oven/bun:1.3-alpine AS pruner
WORKDIR /app
COPY . .
RUN bun install -g turbo@2.6.1
RUN turbo prune web --docker

# Ensure server tsconfig is included (needed for web's TypeScript references)
RUN mkdir -p /app/out/full/apps/server && \
    test -f apps/server/tsconfig.json && \
    cp apps/server/tsconfig.json /app/out/full/apps/server/ || true

# Builder stage (Install all deps & Build)
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

# Copy pruned package.json files (for layer caching)
COPY --from=pruner /app/out/json/ .

# Remove the pruned lockfile (it may be corrupted) and regenerate
RUN rm -f bun.lock

# Install dependencies (only web's dependencies, including devDeps for build)
RUN bun install --no-optional

# Copy pruned source code (includes server types and tsconfig for @server/* imports)
COPY --from=pruner /app/out/full/ .

# Build web application.
# Sentry: the release (git sha) is baked into the bundle; source maps are only
# uploaded when the sentry_auth_token build secret is provided (skipped otherwise).
ARG SENTRY_RELEASE=""
ARG SENTRY_ORG=""
ARG SENTRY_PROJECT=""
ENV VITE_SENTRY_RELEASE=$SENTRY_RELEASE \
    SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT
WORKDIR /app/apps/web
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    bun run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder (web application's static files)
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Add runtime env script
COPY <<'EOF' /docker-entrypoint.d/40-env-config.sh
#!/bin/sh
echo "Generating env-config.js..."
cat > /usr/share/nginx/html/env-config.js << ENVJS
window.__ENV__ = {
  VITE_SERVER_URL: "${VITE_SERVER_URL:-http://localhost:4000}",
  VITE_SENTRY_DSN: "${VITE_SENTRY_DSN:-}",
  VITE_SENTRY_ENVIRONMENT: "${VITE_SENTRY_ENVIRONMENT:-production}",
  VITE_SENTRY_TRACES_SAMPLE_RATE: "${VITE_SENTRY_TRACES_SAMPLE_RATE:-0.1}"
};
ENVJS
echo "env-config.js generated with VITE_SERVER_URL=${VITE_SERVER_URL:-http://localhost:4000}"
EOF

RUN chmod +x /docker-entrypoint.d/40-env-config.sh

# Copy nginx configuration
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Create non-root user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
