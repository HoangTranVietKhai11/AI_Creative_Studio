// ============================================
// ContentPilot AI — Users Service
// ============================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { encrypt, decrypt } from '../../common/encryption';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        provider: true,
        preferredModel: true,
        createdAt: true,
        updatedAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            messagesUsed: true,
            messagesLimit: true,
            documentsUsed: true,
            documentsLimit: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string; preferredModel?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        preferredModel: true,
      },
    });
  }

  async setApiKey(userId: string, apiKey: string): Promise<void> {
    const encryptionKey = this.config.get<string>('ENCRYPTION_KEY')!;
    const encryptedKey = encrypt(apiKey, encryptionKey);

    await this.prisma.user.update({
      where: { id: userId },
      data: { encryptedApiKey: encryptedKey },
    });
  }

  async getApiKey(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { encryptedApiKey: true },
    });

    if (!user?.encryptedApiKey) return null;

    const encryptionKey = this.config.get<string>('ENCRYPTION_KEY')!;
    return decrypt(user.encryptedApiKey, encryptionKey);
  }

  async deleteApiKey(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { encryptedApiKey: null },
    });
  }

  async hasApiKey(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { encryptedApiKey: true },
    });
    return !!user?.encryptedApiKey;
  }
}
