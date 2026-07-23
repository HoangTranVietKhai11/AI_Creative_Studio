// ============================================
// ContentPilot AI — Root Application Module
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ChatModule } from './modules/chat/chat.module';
import { AgentsModule } from './modules/agents/agents.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { SearchModule } from './modules/search/search.module';
import { MediaModule } from './modules/media/media.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    // ── Configuration ────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ── Rate Limiting ────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,  // 1 second
        limit: 10,  // 10 requests
      },
      {
        name: 'medium',
        ttl: 60000,  // 1 minute
        limit: 100,  // 100 requests
      },
      {
        name: 'long',
        ttl: 3600000,  // 1 hour
        limit: 1000,   // 1000 requests
      },
    ]),

    // ── BullMQ Queues ────────────────────────
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),

    // ── Database ─────────────────────────────
    PrismaModule,

    // ── Feature Modules ──────────────────────
    AuthModule,
    UsersModule,
    ProjectsModule,
    ChatModule,
    AgentsModule,
    KnowledgeModule,
    SearchModule,
    MediaModule,
    BillingModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
