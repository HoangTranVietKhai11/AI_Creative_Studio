// ============================================
// ContentPilot AI — Embedding Utilities
// ============================================

import { EMBEDDING_CONFIG } from '@contentpilot/shared';
import { createHash } from 'crypto';

// ──────────────────────────────────────────────
// Text Chunking (Recursive Character Splitter)
// ──────────────────────────────────────────────

export interface TextChunk {
  content: string;
  index: number;
  contentHash: string;
  metadata: Record<string, unknown>;
}

/**
 * Split text into overlapping chunks for embedding.
 * Uses a recursive character splitting strategy with
 * configurable chunk size and overlap.
 */
export function chunkText(
  text: string,
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
    metadata?: Record<string, unknown>;
  } = {},
): TextChunk[] {
  const chunkSize = options.chunkSize ?? EMBEDDING_CONFIG.CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap ?? EMBEDDING_CONFIG.CHUNK_OVERLAP;
  const metadata = options.metadata ?? {};

  // Clean and normalize text
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedText) return [];

  // Split by paragraphs first, then sentences, then words
  const separators = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '];

  const chunks = recursiveSplit(cleanedText, separators, chunkSize, chunkOverlap);

  return chunks
    .filter(c => c.trim().length > 20) // Skip tiny chunks
    .slice(0, EMBEDDING_CONFIG.MAX_CHUNKS_PER_DOCUMENT)
    .map((content, index) => ({
      content: content.trim(),
      index,
      contentHash: hashContent(content.trim()),
      metadata: { ...metadata, chunkIndex: index },
    }));
}

function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  chunkOverlap: number,
): string[] {
  if (text.length <= chunkSize) return [text];

  const separator = separators.find(sep => text.includes(sep)) ?? '';
  const parts = separator ? text.split(separator) : [text];

  const chunks: string[] = [];
  let currentChunk = '';

  for (const part of parts) {
    const nextChunk = currentChunk
      ? currentChunk + separator + part
      : part;

    if (nextChunk.length > chunkSize && currentChunk) {
      chunks.push(currentChunk);

      // Create overlap by keeping the end of the current chunk
      const overlapText = currentChunk.slice(-chunkOverlap);
      currentChunk = overlapText + separator + part;
    } else {
      currentChunk = nextChunk;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // If any chunk is still too large, split with the next separator
  if (separators.length > 1) {
    const nextSeparators = separators.slice(1);
    return chunks.flatMap(chunk =>
      chunk.length > chunkSize * 1.5
        ? recursiveSplit(chunk, nextSeparators, chunkSize, chunkOverlap)
        : [chunk],
    );
  }

  return chunks;
}

// ──────────────────────────────────────────────
// Content Hashing (for deduplication)
// ──────────────────────────────────────────────

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// ──────────────────────────────────────────────
// Format Search Results for Prompt Context
// ──────────────────────────────────────────────

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export function formatSearchResultsForContext(results: SearchResult[]): string {
  if (!results.length) return '';

  return results
    .map((r, i) => `[Source ${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join('\n\n---\n\n');
}

export function formatKnowledgeBaseForContext(
  chunks: Array<{ content: string; similarity: number; documentTitle?: string }>,
): string {
  if (!chunks.length) return '';

  return chunks
    .map((c, i) => {
      const source = c.documentTitle ? ` (from: ${c.documentTitle})` : '';
      return `[KB ${i + 1}]${source} (relevance: ${(c.similarity * 100).toFixed(0)}%)\n${c.content}`;
    })
    .join('\n\n---\n\n');
}
