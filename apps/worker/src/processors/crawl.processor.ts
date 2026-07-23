// ============================================
// ContentPilot AI — Auto-Crawl Processor
// ============================================
// Scheduled job: crawls trusted marketing sources,
// extracts content, generates embeddings, stores them.

import { Job, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { chunkText, hashContent } from '@contentpilot/ai';
import { QUEUE_NAMES } from '@contentpilot/shared';
import { v4 as uuidv4 } from 'uuid';

interface CrawlSource {
  name: string;
  url: string;
}

export async function processCrawlJob(job: Job<any>, prisma: PrismaClient) {
  const { sources, type } = job.data as {
    sources: readonly CrawlSource[];
    type: string;
  };

  console.log(`🌐 Auto-crawl started (${type}): ${sources.length} sources`);

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY required for embedding generation');
  }

  let totalArticles = 0;
  let totalEmbeddings = 0;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    console.log(`  📖 Crawling: ${source.name} (${source.url})`);

    try {
      // ── Step 1: Fetch Content ────────────────
      let content = '';

      if (firecrawlApiKey) {
        content = await firecrawlScrape(source.url, firecrawlApiKey);
      } else {
        content = await basicFetch(source.url);
      }

      if (!content || content.length < 100) {
        console.log(`  ⚠️ Insufficient content from ${source.name}`);
        continue;
      }

      totalArticles++;

      // ── Step 2: Create Document Record ───────
      const document = await prisma.document.create({
        data: {
          title: `[Auto-Crawl] ${source.name} - ${new Date().toISOString().split('T')[0]}`,
          type: 'URL',
          status: 'PROCESSING',
          sourceUrl: source.url,
          rawContent: content.substring(0, 50000),
          metadata: { source: source.name, crawlType: type },
        },
      });

      // ── Step 3: Chunk ────────────────────────
      const chunks = chunkText(content, {
        metadata: { source: source.name, crawlDate: new Date().toISOString() },
      });

      // ── Step 4: Deduplicate & Embed ──────────
      const newChunks = [];
      for (const chunk of chunks) {
        const exists = await prisma.embedding.findFirst({
          where: { contentHash: chunk.contentHash },
          select: { id: true },
        });
        if (!exists) newChunks.push(chunk);
      }

      if (newChunks.length === 0) {
        await prisma.document.update({
          where: { id: document.id },
          data: { status: 'COMPLETED', chunkCount: 0 },
        });
        console.log(`  ⏭️ All content already indexed for ${source.name}`);
        continue;
      }

      // Generate embeddings in batches
      const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      const embeddingModel = process.env.OPENROUTER_EMBEDDING_MODEL || 'openai/text-embedding-3-small';
      const batchSize = 20;
      let stored = 0;

      for (let j = 0; j < newChunks.length; j += batchSize) {
        const batch = newChunks.slice(j, j + batchSize);

        const response = await fetch(`${baseUrl}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openrouterApiKey}`,
          },
          body: JSON.stringify({
            model: embeddingModel,
            input: batch.map(c => c.content),
          }),
        });

        if (!response.ok) {
          console.error(`  ❌ Embedding API error for ${source.name}`);
          continue;
        }

        const data = await response.json() as any;
        const embeddings = (data.data || [])
          .sort((a: any, b: any) => a.index - b.index)
          .map((d: any) => d.embedding);

        for (let k = 0; k < batch.length; k++) {
          const chunk = batch[k];
          const embedding = embeddings[k];
          if (!embedding) continue;

          const vectorStr = `[${embedding.join(',')}]`;

          await prisma.$executeRawUnsafe(
            `INSERT INTO embeddings (id, document_id, content, content_hash, embedding, source, metadata, created_at)
             VALUES ($1::uuid, $2::uuid, $3, $4, $5::vector, 'AUTO_CRAWL', $6::jsonb, NOW())
             ON CONFLICT DO NOTHING`,
            uuidv4(),
            document.id,
            chunk.content,
            chunk.contentHash,
            vectorStr,
            JSON.stringify(chunk.metadata),
          );

          stored++;
        }

        // Rate limit: wait between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await prisma.document.update({
        where: { id: document.id },
        data: { status: 'COMPLETED', chunkCount: stored },
      });

      totalEmbeddings += stored;
      console.log(`  ✅ ${source.name}: ${stored} new embeddings stored`);
    } catch (error: any) {
      console.error(`  ❌ Error crawling ${source.name}:`, error.message);
    }

    // Progress update
    await job.updateProgress(Math.round(((i + 1) / sources.length) * 100));
  }

  console.log(`🏁 Auto-crawl complete: ${totalArticles} sources, ${totalEmbeddings} embeddings`);

  return { totalArticles, totalEmbeddings };
}

// ── Helper Functions ─────────────────────────

async function firecrawlScrape(url: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
    }),
  });

  if (!response.ok) return '';
  const data = await response.json() as any;
  return data.data?.markdown || '';
}

async function basicFetch(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ContentPilot-AI/1.0 (knowledge-crawler)',
      },
    });
    const html = await response.text();
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}
