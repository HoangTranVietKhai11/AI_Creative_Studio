// ============================================
// ContentPilot AI — Projects Service
// ============================================

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: {
    name: string;
    description?: string;
    industry?: string;
    niche?: string;
    brandVoice?: string;
    targetAudience?: string;
  }) {
    return this.prisma.project.create({
      data: { ...data, userId },
    });
  }

  async findAllByUser(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          _count: { select: { conversations: true } },
        },
      }),
      this.prisma.project.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: { select: { conversations: true } },
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Access denied');

    return project;
  }

  async update(projectId: string, userId: string, data: {
    name?: string;
    description?: string;
    industry?: string;
    niche?: string;
    brandVoice?: string;
    targetAudience?: string;
  }) {
    const project = await this.findById(projectId, userId);
    return this.prisma.project.update({
      where: { id: project.id },
      data,
    });
  }

  async delete(projectId: string, userId: string) {
    const project = await this.findById(projectId, userId);
    await this.prisma.project.delete({ where: { id: project.id } });
    return { message: 'Project deleted' };
  }
}
