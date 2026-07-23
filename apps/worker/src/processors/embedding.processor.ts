// ============================================
// ContentPilot AI — Embedding Processor
// ============================================
// Processes document uploads: extract text → chunk → embed → store

import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { chunkText, hashContent } from '@contentpilot/ai';
import { v4 as uuidv4 } from 'uuid';

export async function processEmbeddingJob(job: Job, prisma: PrismaClient) {
  const { documentId, type, filePath, sourceUrl, rawContent } = job.data;

  console.log(`📄 Processing document: ${documentId} (${type})`);

  try {
    // Update status to PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // ── Step 1: Extract Text ─────────────────
    let text = rawContent || '';

    if (!text && filePath) {
      text = await extractText(filePath, type);
    }

    if (!text && sourceUrl) {
      text = await scrapeUrl(sourceUrl);
    }

    if (!text) {
      throw new Error('No text content could be extracted');
    }

    // ── Step 2: Chunk Text ───────────────────
    const chunks = chunkText(text, {
      metadata: { documentId, type },
    });

    console.log(`  → ${chunks.length} chunks created`);

    // ── Step 3: Generate Embeddings ──────────
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const embeddingModel = process.env.OPENROUTER_EMBEDDING_MODEL || 'openai/text-embedding-3-small';

    // Process in batches of 20
    const batchSize = 20;
    let storedCount = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      // Check for duplicates first
      const newChunks = [];
      for (const chunk of batch) {
        const exists = await prisma.embedding.findFirst({
          where: { contentHash: chunk.contentHash },
          select: { id: true },
        });
        if (!exists) newChunks.push(chunk);
      }

      if (newChunks.length === 0) continue;

      // Generate embeddings for non-duplicate chunks
      const response = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: newChunks.map(c => c.content),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Embedding API error: ${response.status} — ${error}`);
      }

      const data = await response.json();
      const embeddings = (data.data || [])
        .sort((a: any, b: any) => a.index - b.index)
        .map((d: any) => d.embedding);

      // ── Step 4: Store Embeddings ─────────────
      for (let j = 0; j < newChunks.length; j++) {
        const chunk = newChunks[j];
        const embedding = embeddings[j];
        if (!embedding) continue;

        const vectorStr = `[${embedding.join(',')}]`;
        const id = uuidv4();

        await prisma.$executeRawUnsafe(
          `INSERT INTO embeddings (id, document_id, content, content_hash, embedding, source, metadata, created_at)
           VALUES ($1::uuid, $2::uuid, $3, $4, $5::vector, 'UPLOAD', $6::jsonb, NOW())
           ON CONFLICT DO NOTHING`,
          id,
          documentId,
          chunk.content,
          chunk.contentHash,
          vectorStr,
          JSON.stringify(chunk.metadata),
        );

        storedCount++;
      }

      // Progress update
      await job.updateProgress(Math.round(((i + batch.length) / chunks.length) * 100));
    }

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'COMPLETED',
        rawContent: text.substring(0, 50000), // Store first 50K chars
        chunkCount: storedCount,
      },
    });

    console.log(`  ✅ ${storedCount} embeddings stored for document ${documentId}`);

    return { storedCount };
  } catch (error: any) {
    console.error(`  ❌ Error processing document ${documentId}:`, error.message);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'FAILED',
        errorMsg: error.message.substring(0, 500),
      },
    });

    throw error;
  }
}

// ── Text Extraction Helpers ─────────────────

async function extractText(filePath: string, type: string): Promise<string> {
  const buffer = readFileSync(filePath);

  switch (type) {
    case 'PDF': {
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(buffer);
      return result.text;
    }
    case 'DOCX': {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'TXT':
    case 'MARKDOWN': {
      return buffer.toString('utf-8');
    }
    case 'CSV': {
      // Convert CSV to text representation
      return buffer.toString('utf-8');
    }
    default:
      return buffer.toString('utf-8');
  }
}

async function scrapeUrl(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (apiKey) {
    // Use Firecrawl for better extraction
    try {
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

      if (response.ok) {
        const data = await response.json();
        return data.data?.markdown || data.data?.content || '';
      }
    } catch (error) {
      console.warn('Firecrawl scrape failed, falling back to basic fetch');
    }
  }

  // Fallback: basic fetch
  const response = await fetch(url);
  const html = await response.text();
  // Strip HTML tags for basic text extraction
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
