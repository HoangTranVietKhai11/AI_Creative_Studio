// ============================================
// ContentPilot AI — Knowledge Base Service
// ============================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '@contentpilot/shared';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.EMBEDDING) private readonly embeddingQueue: Queue,
  ) {}

  /**
   * Create a document record and queue it for processing.
   */
  async createDocument(params: {
    userId: string;
    title: string;
    type: string;
    filePath?: string;
    sourceUrl?: string;
    fileSize?: number;
    mimeType?: string;
    rawContent?: string;
  }) {
    const document = await this.prisma.document.create({
      data: {
        userId: params.userId,
        title: params.title,
        type: params.type as any,
        status: 'PENDING',
        filePath: params.filePath,
        sourceUrl: params.sourceUrl,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        rawContent: params.rawContent,
      },
    });

    // Queue for background processing (text extraction → chunking → embedding)
    await this.embeddingQueue.add('process-document', {
      documentId: document.id,
      type: params.type,
      filePath: params.filePath,
      sourceUrl: params.sourceUrl,
      rawContent: params.rawContent,
    });

    this.logger.log(`Document queued for processing: ${document.id}`);

    return document;
  }

  /**
   * Get all documents for a user.
   */
  async getDocuments(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          fileSize: true,
          chunkCount: true,
          errorMsg: true,
          createdAt: true,
        },
      }),
      this.prisma.document.count({ where: { userId } }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * Delete a document and its embeddings.
   */
  async deleteDocument(documentId: string, userId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.userId !== userId) throw new NotFoundException('Document not found');

    await this.prisma.document.delete({ where: { id: documentId } });
    return { message: 'Document deleted' };
  }

  /**
   * Search embeddings by semantic similarity.
   * This is the core RAG retrieval function.
   */
  async searchSimilar(
    query: string,
    options: { threshold?: number; limit?: number } = {},
  ): Promise<Array<{
    content: string;
    similarity: number;
    documentTitle?: string;
  }>> {
    // We need the query embedding — this will be called by the orchestrator
    // which has access to OpenRouterService. For now, this is a raw DB search.
    // The actual embedding generation happens in the orchestrator layer.

    // This method expects pre-computed embedding from the caller
    // We'll refactor this to accept embedding vector directly
    return [];
  }

  /**
   * Search embeddings with a pre-computed embedding vector.
   */
  async searchByVector(
    queryEmbedding: number[],
    options: { threshold?: number; limit?: number } = {},
  ): Promise<Array<{
    content: string;
    similarity: number;
    documentTitle?: string;
  }>> {
    const results = await this.prisma.searchEmbeddings(queryEmbedding, {
      threshold: options.threshold ?? 0.7,
      limit: options.limit ?? 10,
    });

    // Enrich with document titles
    const documentIds = [...new Set(results.filter(r => r.document_id).map(r => r.document_id!))];
    const documents = documentIds.length > 0
      ? await this.prisma.document.findMany({
          where: { id: { in: documentIds } },
          select: { id: true, title: true },
        })
      : [];

    const docMap = new Map(documents.map(d => [d.id, d.title]));

    return results.map(r => ({
      content: r.content,
      similarity: r.similarity,
      documentTitle: r.document_id ? docMap.get(r.document_id) : undefined,
    }));
  }
}
