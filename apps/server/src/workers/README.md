# BullMQ Worker Migration

This directory contains the BullMQ-based worker implementation that replaced the custom worker pool system.

## Architecture

### Queues (`/lib/queue.ts`)
- Defines BullMQ queues for job management
- Configures Redis connection settings
- Sets default job options (retries, backoff, cleanup)

### Workers (`/workers/*.worker.ts`)
- Process jobs from queues
- Each worker handles a specific job type
- Run as separate processes for scalability

## Available Workers

### RAG Worker (`rag.worker.ts`)
Processes embedding generation for wiki articles.

**Job Type:** `generate-embeddings`

**Job Data:**
```typescript
{
  type: "generate-embeddings";
  articleId: number;
  content: string;
}
```

**Features:**
- Concurrent processing (4 jobs at once)
- Rate limiting (10 jobs/second)
- Progress tracking (0% → 100%)
- Automatic retry on failure (3 attempts with exponential backoff)

## Setup

### 1. Install Redis

**Using Docker (recommended):**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Or using Homebrew:**
```bash
brew install redis
brew services start redis
```

### 2. Configure Environment

Add to your `.env`:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # optional
```

### 3. Start the Worker

**Development:**
```bash
bun run dev:worker
```

**Production:**
```bash
bun run src/workers/index.ts
```

## Usage

### Adding Jobs to Queue

```typescript
import { ragQueue } from "@/lib/queue";

// Add a job
await ragQueue.add("generate-embeddings", {
  type: "generate-embeddings",
  articleId: 123,
  content: "Article content...",
});

// Add with options
await ragQueue.add(
  "generate-embeddings",
  { /* job data */ },
  {
    priority: 1,  // Higher priority
    delay: 5000,  // Delay 5 seconds
    attempts: 5,  // More retries
  }
);
```

### Monitoring

BullMQ provides built-in monitoring through events:

```typescript
ragWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

ragWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

ragWorker.on("progress", (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});
```

## Advanced Features

### Job Scheduling
```typescript
import { ragQueue } from "@/lib/queue";

// Schedule a job to run later
await ragQueue.add(
  "generate-embeddings",
  { /* data */ },
  { delay: 60000 } // 1 minute
);

// Repeat every hour
await ragQueue.add(
  "generate-embeddings",
  { /* data */ },
  {
    repeat: {
      pattern: "0 * * * *" // Cron syntax
    }
  }
);
```

### Queue Management
```typescript
import { ragQueue } from "@/lib/queue";

// Pause queue
await ragQueue.pause();

// Resume queue
await ragQueue.resume();

// Get job counts
const counts = await ragQueue.getJobCounts();

// Clean old jobs
await ragQueue.clean(24 * 3600 * 1000, 100); // Remove completed jobs older than 24h
```

### Bull Board (Optional UI)
Install Bull Board for a web UI to monitor queues:

```bash
bun add @bull-board/api @bull-board/elysia
```

```typescript
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";

const serverAdapter = new ElysiaAdapter();
createBullBoard({
  queues: [new BullMQAdapter(ragQueue)],
  serverAdapter
});

app.use("/admin/queues", serverAdapter.registerPlugin());
```

## Migration from Custom Worker Pool

The old `WorkerPool` class has been replaced with BullMQ:

| Old (Worker Pool) | New (BullMQ) |
|------------------|--------------|
| `workerPool.execute(data)` | `await queue.add("job-name", data)` |
| `workerPool.dispatch(data)` | `await queue.add("job-name", data)` |
| Custom queue management | Redis-backed persistence |
| In-process workers | Separate worker processes |
| Manual retry logic | Built-in retry with backoff |
| No job persistence | Jobs survive restarts |

## Benefits

1. **Reliability**: Jobs are persisted in Redis and survive application restarts
2. **Scalability**: Run multiple worker processes across different servers
3. **Observability**: Built-in job tracking, progress, and monitoring
4. **Flexibility**: Priority queues, delayed jobs, repeating jobs
5. **Performance**: Optimized job processing with rate limiting and concurrency control

## Troubleshooting

### Worker not processing jobs
- Check Redis connection: `redis-cli ping`
- Verify environment variables are set
- Check worker logs for errors

### Jobs failing repeatedly
- Check job retry configuration
- Review error logs in worker output
- Verify job data is valid

### Memory issues
- Adjust job cleanup settings in `queue.ts`
- Reduce worker concurrency
- Monitor Redis memory usage

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [BullMQ GitHub](https://github.com/taskforcesh/bullmq)
