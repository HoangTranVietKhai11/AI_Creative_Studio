import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const totalUsers = await this.prisma.user.count();
    const totalProjects = await this.prisma.project.count();
    const totalDocuments = await this.prisma.document.count();
    const totalMedia = await this.prisma.uploadedMedia.count();
    const totalConversations = await this.prisma.conversation.count();
    const totalMessages = await this.prisma.message.count();

    return {
      totalUsers,
      totalProjects,
      totalDocuments,
      totalMedia,
      totalConversations,
      totalMessages,
    };
  }

  async getUsers(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          provider: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  async updateUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: 'User deleted successfully' };
  }

  // ──────────────────────────────────────────────
  // AGENTS
  // ──────────────────────────────────────────────

  async getAgents() {
    return this.prisma.agentConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAgent(data: any) {
    return this.prisma.agentConfig.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        systemPrompt: data.systemPrompt,
        model: data.model,
        isActive: data.isActive,
      }
    });
  }

  async updateAgent(id: string, data: any) {
    return this.prisma.agentConfig.update({
      where: { id },
      data
    });
  }

  async deleteAgent(id: string) {
    await this.prisma.agentConfig.delete({ where: { id } });
    return { success: true };
  }

  // ──────────────────────────────────────────────
  // SYSTEM CONFIGS
  // ──────────────────────────────────────────────

  async getSystemConfigs() {
    return this.prisma.systemConfig.findMany();
  }

  async updateSystemConfig(key: string, value: string, isSecret: boolean = false) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value, isSecret },
      create: { key, value, isSecret },
    });
  }
}
