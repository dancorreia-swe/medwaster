# BullMQ Migration Summary

## What Changed

Your custom worker pool implementation has been replaced with BullMQ, a production-ready queue system backed by Redis.

## New Files

1. **`src/lib/queue.ts`** - Queue configuration and initialization
2. **`src/workers/rag.worker.ts`** - BullMQ worker for RAG jobs
3. **`src/workers/index.ts`** - Worker process entry point
4. **`src/workers/README.md`** - Comprehensive documentation

## Modified Files

1. **`src/modules/wiki/services/article-service.ts`**
   - Replaced `ragPool.dispatch()` with `ragQueue.add()`
   - Changed from fire-and-forget to proper job queueing
   - Jobs now persist in Redis and retry on failure

2. **`apps/server/package.json`**
   - Added `dev:worker` script to run workers

## Deprecated Files (can be removed)

- `src/lib/worker-pool.ts` - Old custom worker pool
- `src/workers/rag-worker.ts` - Old Web Worker implementation

## Setup Required

### 1. Start Redis

```bash
# Using Docker (recommended)
docker run -d --name redis -p 6379:6379 redis:alpine

# Or using Homebrew
brew install redis
brew services start redis
```

### 2. Update .env

The required Redis variables are already in your `.env.example`:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # optional
```

### 3. Run the Application

You now need to run **two processes**:

**Terminal 1 - API Server:**
```bash
bun run dev
```

**Terminal 2 - Worker Process:**
```bash
bun run dev:worker
```

Or use a process manager like PM2 or Docker Compose to run both.

## Key Benefits

### Before (Custom Worker Pool)
- ❌ Jobs lost on server restart
- ❌ No retry mechanism
- ❌ Manual queue management
- ❌ Limited to single server
- ❌ No job visibility

### After (BullMQ)
- ✅ Jobs persisted in Redis
- ✅ Automatic retries with exponential backoff
- ✅ Battle-tested queue system
- ✅ Scale workers across multiple servers
- ✅ Job progress tracking and monitoring
- ✅ Built-in rate limiting and concurrency control

## Usage Examples

### Enqueuing Jobs

The article service now uses BullMQ:

```typescript
// Before
ragPool.dispatch({
  type: "generate-embeddings",
  articleId: 123,
  content: "...",
});

// After
await ragQueue.add("generate-embeddings", {
  type: "generate-embeddings",
  articleId: 123,
  content: "...",
});
```

### Advanced Options

```typescript
// Priority job
await ragQueue.add("generate-embeddings", data, {
  priority: 1,
});

// Delayed job
await ragQueue.add("generate-embeddings", data, {
  delay: 5000, // 5 seconds
});

// Custom retry logic
await ragQueue.add("generate-embeddings", data, {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
});
```

## Monitoring

Workers log events automatically:

```
[RAG Worker] Job 123 completed successfully
[RAG Worker] Job 456 failed: Connection timeout
```

For advanced monitoring, consider adding Bull Board:

```bash
bun add @bull-board/api @bull-board/elysia
```

## Production Deployment

### Docker Compose Example

```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  api:
    build: .
    command: bun run start
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - redis

  worker:
    build: .
    command: bun run src/workers/index.ts
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - redis
    deploy:
      replicas: 2  # Run 2 worker instances

volumes:
  redis-data:
```

### Scaling Workers

You can run multiple worker instances:

```bash
# On different servers or in different containers
bun run src/workers/index.ts
```

Each worker will pull jobs from the queue automatically.

## Troubleshooting

### Workers not processing jobs

1. Check Redis is running: `redis-cli ping`
2. Verify environment variables
3. Check worker logs for connection errors

### Jobs failing

1. Review job data structure matches `RAGJobData` type
2. Check worker logs for specific errors
3. Verify retry configuration in `queue.ts`

### Redis connection issues

```typescript
// In queue.ts, add more connection options:
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
};
```

## Next Steps

1. ✅ Start Redis server
2. ✅ Update `.env` with Redis config
3. ✅ Run both API and worker processes
4. ✅ Test by publishing a wiki article (triggers embedding generation)
5. ✅ Monitor worker logs to see job processing
6. 🔲 Optional: Set up Bull Board for UI monitoring
7. 🔲 Optional: Remove deprecated files (`worker-pool.ts`, old `rag-worker.ts`)

## Documentation

Full documentation is available in `src/workers/README.md`

## Questions?

- BullMQ Docs: https://docs.bullmq.io/
- Redis Setup: https://redis.io/docs/getting-started/
