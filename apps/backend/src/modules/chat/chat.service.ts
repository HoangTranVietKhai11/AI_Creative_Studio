// ============================================
// ContentPilot AI — Chat Service
// ============================================

import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentOrchestratorService, AgentExecutionInput } from '../agents/agent-orchestrator.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: AgentOrchestratorService,
  ) {}

  async beginStream(params: {
    userId: string;
    conversationId?: string;
    message: string;
    projectId?: string;
    model?: string;
  }) {
    let conversationId = params.conversationId;
    const project = params.projectId
      ? await this.prisma.project.findFirst({
          where: { id: params.projectId, userId: params.userId },
          select: { industry: true, brandVoice: true, targetAudience: true },
        })
      : null;

    if (params.projectId && !project) {
      throw new ForbiddenException('Project not found or access denied');
    }

    if (conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId: params.userId },
        select: { id: true },
      });
      if (!conversation) throw new NotFoundException('Conversation not found');
    } else {
      const conversation = await this.prisma.conversation.create({
        data: {
          userId: params.userId,
          projectId: params.projectId,
          title: params.message.slice(0, 100),
          model: params.model,
        },
      });
      conversationId = conversation.id;
    }

    await this.prisma.message.create({
      data: { conversationId, role: 'user', content: params.message },
    });
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    return {
      conversationId,
      history,
      projectContext: project
        ? {
            industry: project.industry || undefined,
            brandVoice: project.brandVoice || undefined,
            targetAudience: project.targetAudience || undefined,
          }
        : undefined,
    };
  }

  async completeStream(params: {
    userId: string;
    conversationId: string;
    content: string;
    agentName?: string;
    sources?: unknown;
  }) {
    if (!params.content.trim()) return;
    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: params.conversationId,
          role: 'assistant',
          content: params.content,
          agentName: params.agentName,
          sources: params.sources as any,
        },
      }),
      this.prisma.subscription.updateMany({
        where: { userId: params.userId },
        data: { messagesUsed: { increment: 1 } },
      }),
    ]);
  }

  /**
   * Send a message and get a response from the AI agent pipeline.
   */
  async sendMessage(params: {
    userId: string;
    conversationId?: string;
    message: string;
    projectId?: string;
    model?: string;
    imageUrls?: string[];
  }) {
    let conversationId = params.conversationId;

    // Create new conversation if needed
    if (!conversationId) {
      const conversation = await this.prisma.conversation.create({
        data: {
          userId: params.userId,
          projectId: params.projectId,
          title: params.message.substring(0, 100),
          model: params.model,
        },
      });
      conversationId = conversation.id;
    }

    // Save user message
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: params.message,
      },
    });

    // Get conversation history for context
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    // Get project context if available
    let projectContext: AgentExecutionInput['projectContext'];
    if (params.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: params.projectId },
        select: { industry: true, brandVoice: true, targetAudience: true },
      });
      if (project) {
        projectContext = {
          industry: project.industry || undefined,
          brandVoice: project.brandVoice || undefined,
          targetAudience: project.targetAudience || undefined,
        };
      }
    }

    // Execute agent pipeline
    const result = await this.orchestrator.execute({
      userId: params.userId,
      message: params.message,
      conversationHistory: history.map(m => ({ role: m.role, content: m.content })),
      projectContext,
      model: params.model,
      imageUrls: params.imageUrls,
    });

    // Save assistant message
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: result.content,
        agentName: result.agentName,
        sources: result.sources as any,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      },
    });

    // Increment usage counter
    await this.prisma.subscription.updateMany({
      where: { userId: params.userId },
      data: { messagesUsed: { increment: 1 } },
    });

    return {
      conversationId,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: result.content,
        agentName: result.agentName,
        sources: result.sources,
        model: result.model,
        createdAt: assistantMessage.createdAt,
      },
    };
  }

  /**
   * Get all conversations for a user.
   */
  async getConversations(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          projectId: true,
          model: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.conversation.count({ where: { userId } }),
    ]);

    return {
      items: items.map(c => ({ ...c, messageCount: c._count.messages })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get messages for a conversation.
   */
  async getMessages(conversationId: string, userId: string) {
    // Verify ownership
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        agentName: true,
        sources: true,
        promptTokens: true,
        completionTokens: true,
        createdAt: true,
      },
    });
  }

  /**
   * Delete a conversation and all its messages.
   */
  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { message: 'Conversation deleted' };
  }
}
