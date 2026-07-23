// ============================================
// ContentPilot AI — Prisma Service
// ============================================

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected');

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error Prisma event typing
      this.$on('query', (e: { duration: number; query: string }) => {
        if (e.duration > 500) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Perform a vector similarity search using pgvector.
   * Returns the most similar embeddings to the query vector.
   */
  async searchEmbeddings(
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      source?: string;
    } = {},
  ): Promise<
    Array<{
      id: string;
      document_id: string | null;
      content: string;
      source: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }>
  > {
    const { threshold = 0.7, limit = 10, source } = options;
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    let query: string;
    let params: unknown[];

    if (source) {
      query = `
        SELECT
          id, document_id, content, source::text, metadata,
          1 - (embedding <=> $1::vector) AS similarity
        FROM embeddings
        WHERE 1 - (embedding <=> $1::vector) > $2
          AND source = $4
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `;
      params = [vectorStr, threshold, limit, source];
    } else {
      query = `
        SELECT
          id, document_id, content, source::text, metadata,
          1 - (embedding <=> $1::vector) AS similarity
        FROM embeddings
        WHERE 1 - (embedding <=> $1::vector) > $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `;
      params = [vectorStr, threshold, limit];
    }

    return this.$queryRawUnsafe(query, ...params);
  }

  /**
   * Store an embedding vector in the database.
   */
  async storeEmbedding(params: {
    id: string;
    documentId: string | null;
    content: string;
    contentHash: string;
    embedding: number[];
    source: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const vectorStr = `[${params.embedding.join(',')}]`;
    const metadataStr = JSON.stringify(params.metadata ?? {});

    await this.$executeRawUnsafe(
      `INSERT INTO embeddings (id, document_id, content, content_hash, embedding, source, metadata)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5::vector, $6::text, $7::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      params.id,
      params.documentId,
      params.content,
      params.contentHash,
      vectorStr,
      params.source,
      metadataStr,
    );
  }

  /**
   * Check if content already exists by hash (deduplication).
   */
  async embeddingExistsByHash(contentHash: string): Promise<boolean> {
    const result = await this.embedding.findFirst({
      where: { contentHash },
      select: { id: true },
    });
    return !!result;
  }
}
