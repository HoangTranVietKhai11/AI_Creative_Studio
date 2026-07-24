import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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
          subscription: {
            select: {
              plan: true,
              status: true
            }
          }
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

  async createUser(data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user and subscription in a transaction
    const user = await this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          role: data.role || 'USER',
        },
      });

      if (data.plan) {
        await prisma.subscription.create({
          data: {
            userId: newUser.id,
            plan: data.plan,
            status: 'ACTIVE',
            messagesLimit: data.plan === 'AGENCY' ? 1000 : data.plan === 'PRO' ? 500 : 50,
            documentsLimit: data.plan === 'AGENCY' ? 100 : data.plan === 'PRO' ? 50 : 5,
          },
        });
      }

      return newUser;
    });

    return { success: true, user: { id: user.id, email: user.email } };
  }

  async updateUserSubscription(id: string, plan: 'FREE' | 'PRO' | 'AGENCY') {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: id }
    });

    const messagesLimit = plan === 'AGENCY' ? 1000 : plan === 'PRO' ? 500 : 50;
    const documentsLimit = plan === 'AGENCY' ? 100 : plan === 'PRO' ? 50 : 5;

    if (subscription) {
      await this.prisma.subscription.update({
        where: { userId: id },
        data: { plan, messagesLimit, documentsLimit, status: 'ACTIVE' }
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          userId: id,
          plan,
          status: 'ACTIVE',
          messagesLimit,
          documentsLimit
        }
      });
    }

    return { success: true, plan };
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
