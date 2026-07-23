// ============================================
// ContentPilot AI — Worker Entry Point
// ============================================
// Runs BullMQ workers for background job processing.
// Completely separated from the NestJS API process.
// ============================================

import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { QUEUE_NAMES, AUTO_CRAWL_SOURCES } from '@contentpilot/shared';
import { processEmbeddingJob } from './processors/embedding.processor';
import { processCrawlJob } from './processors/crawl.processor';
import { processMediaAnalysisJob } from './processors/media-analysis.processor';
import * as http from 'http';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  console.log('🔧 ContentPilot AI Worker starting...');

  // Initialize shared dependencies
  const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  const prisma = new PrismaClient();
  await prisma.$connect();

  console.log('✅ Database connected');
  console.log('✅ Redis connected');

  // ── Dummy HTTP Server (for Render Free Tier) ─
  const port = process.env.PORT || 4001;
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK - Worker is alive\n');
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  
  server.listen(port, () => {
    console.log(`🌐 Dummy HTTP Server listening on port ${port} to keep Render happy`);
  });

  // ── Embedding Worker ───────────────────────
  const embeddingWorker = new Worker(
    QUEUE_NAMES.EMBEDDING,
    async (job) => processEmbeddingJob(job, prisma),
    {
      connection: redis,
      concurrency: 2,
      limiter: { max: 10, duration: 60000 },
    },
  );

  embeddingWorker.on('completed', (job) => {
    console.log(`✅ Embedding job completed: ${job.id}`);
  });

  embeddingWorker.on('failed', (job, err) => {
    console.error(`❌ Embedding job failed: ${job?.id}`, err.message);
  });

  // ── Crawl Worker ───────────────────────────
  const crawlWorker = new Worker(
    QUEUE_NAMES.CRAWL,
    async (job) => processCrawlJob(job, prisma),
    {
      connection: redis,
      concurrency: 1,
    },
  );

  crawlWorker.on('completed', (job) => {
    console.log(`✅ Crawl job completed: ${job.id}`);
  });

  crawlWorker.on('failed', (job, err) => {
    console.error(`❌ Crawl job failed: ${job?.id}`, err.message);
  });

  // ── Media Analysis Worker ──────────────────
  const mediaWorker = new Worker(
    QUEUE_NAMES.MEDIA_ANALYSIS,
    async (job) => processMediaAnalysisJob(job, prisma),
    {
      connection: redis,
      concurrency: 1,
    },
  );

  mediaWorker.on('completed', (job) => {
    console.log(`✅ Media analysis completed: ${job.id}`);
  });

  mediaWorker.on('failed', (job, err) => {
    console.error(`❌ Media analysis failed: ${job?.id}`, err.message);
  });

  // ── Schedule Auto-Crawl ────────────────────
  const crawlQueue = new Queue(QUEUE_NAMES.CRAWL, { connection: redis });
  const cronExpression = process.env.AUTO_CRAWL_CRON || '0 */12 * * *';

  // Upsert the repeatable job so it doesn't duplicate across restarts
  await crawlQueue.upsertJobScheduler(
    'auto-crawl-scheduler',
    { pattern: cronExpression },
    {
      name: 'auto-crawl',
      data: {
        sources: AUTO_CRAWL_SOURCES,
        type: 'scheduled',
      },
    },
  );

  console.log(`⏰ Auto-crawl scheduled: ${cronExpression}`);
  console.log('🚀 All workers running. Press Ctrl+C to stop.');

  // ── Graceful Shutdown ──────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    await Promise.all([
      embeddingWorker.close(),
      crawlWorker.close(),
      mediaWorker.close(),
    ]);

    await prisma.$disconnect();
    redis.disconnect();

    console.log('👋 Worker shut down cleanly.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal worker error:', err);
  process.exit(1);
});
