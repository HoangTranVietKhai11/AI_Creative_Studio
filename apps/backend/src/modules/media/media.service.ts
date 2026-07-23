// ============================================
// ContentPilot AI — Media Service
// ============================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '@contentpilot/shared';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.MEDIA_ANALYSIS) private readonly analysisQueue: Queue,
  ) {}

  async createUpload(params: {
    userId: string;
    type: 'IMAGE' | 'VIDEO';
    filename: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
  }) {
    const media = await this.prisma.uploadedMedia.create({
      data: {
        userId: params.userId,
        type: params.type,
        filename: params.filename,
        filePath: params.filePath,
        mimeType: params.mimeType,
        fileSize: params.fileSize,
        analysisStatus: 'PENDING',
      },
    });

    return media;
  }

  async triggerAnalysis(mediaId: string, userId: string) {
    const media = await this.prisma.uploadedMedia.findFirst({
      where: { id: mediaId, userId },
    });

    if (!media) throw new NotFoundException('Media not found');

    // Queue for background analysis
    await this.analysisQueue.add('analyze-media', {
      mediaId: media.id,
      type: media.type,
      filePath: media.filePath,
      mimeType: media.mimeType,
      userId,
    });

    await this.prisma.uploadedMedia.update({
      where: { id: mediaId },
      data: { analysisStatus: 'ANALYZING' },
    });

    return { message: 'Analysis queued', mediaId };
  }

  async getMedia(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.uploadedMedia.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.uploadedMedia.count({ where: { userId } }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getMediaById(mediaId: string, userId: string) {
    const media = await this.prisma.uploadedMedia.findFirst({
      where: { id: mediaId, userId },
    });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async deleteMedia(mediaId: string, userId: string) {
    const media = await this.prisma.uploadedMedia.findFirst({
      where: { id: mediaId, userId },
    });
    if (!media) throw new NotFoundException('Media not found');

    await this.prisma.uploadedMedia.delete({ where: { id: mediaId } });
    return { message: 'Media deleted' };
  }
}
