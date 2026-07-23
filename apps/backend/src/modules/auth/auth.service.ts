// ============================================
// ContentPilot AI — Auth Service
// ============================================

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthProvider } from '@prisma/client';

export interface JwtPayload {
  sub: string;    // user ID
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────
  // Email Registration
  // ──────────────────────────────────────────────

  async register(params: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthTokens> {
    const { email, password, name } = params;

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with free subscription
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        provider: 'EMAIL',
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
            messagesLimit: 50,
            documentsLimit: 5,
          },
        },
      },
    });

    this.logger.log(`New user registered: ${email}`);

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ──────────────────────────────────────────────
  // Email Login
  // ──────────────────────────────────────────────

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`User logged in: ${email}`);

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ──────────────────────────────────────────────
  // OAuth Login/Register
  // ──────────────────────────────────────────────

  async oauthLogin(params: {
    email: string;
    name: string;
    avatarUrl?: string;
    provider: AuthProvider;
    providerId: string;
  }): Promise<AuthTokens> {
    const { email, name, avatarUrl, provider, providerId } = params;

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          provider,
          providerId,
          subscription: {
            create: {
              plan: 'FREE',
              status: 'ACTIVE',
              messagesLimit: 50,
              documentsLimit: 5,
            },
          },
        },
      });
      this.logger.log(`New OAuth user registered: ${email} via ${provider}`);
    } else {
      // Update provider info and avatar if changed
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          avatarUrl: avatarUrl || user.avatarUrl,
          providerId: providerId || user.providerId,
        },
      });
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ──────────────────────────────────────────────
  // Token Refresh
  // ──────────────────────────────────────────────

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ──────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // ──────────────────────────────────────────────
  // Validate JWT Payload
  // ──────────────────────────────────────────────

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        preferredModel: true,
        provider: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // ──────────────────────────────────────────────
  // Token Generation (Private)
  // ──────────────────────────────────────────────

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRY', '15m') as any,
      }),
      this.jwt.signAsync(payload, {
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRY', '7d') as any,
      }),
    ]);

    // Store refresh token hash for validation
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }
}
