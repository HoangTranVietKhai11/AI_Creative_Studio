// ============================================
// ContentPilot AI — Chat Controller
// ============================================

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Sse,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { AgentOrchestratorService } from '../agents/agent-orchestrator.service';
import { CurrentUser } from '../../common/decorators';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly orchestrator: AgentOrchestratorService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async send(
    @CurrentUser('id') userId: string,
    @Body() body: {
      conversationId?: string;
      message: string;
      projectId?: string;
      model?: string;
      attachments?: string[];
    },
  ) {
    return this.chatService.sendMessage({
      userId,
      conversationId: body.conversationId,
      message: body.message,
      projectId: body.projectId,
      model: body.model,
    });
  }

  /**
   * Stream endpoint using Server-Sent Events (SSE).
   * The frontend connects to this endpoint for real-time streaming.
   */
  @Post('stream')
  async stream(
    @CurrentUser() user: any,
    @Body() body: {
      conversationId?: string;
      message: string;
      projectId?: string;
      model?: string;
    },
    @Res() res: Response,
  ) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const context = await this.chatService.beginStream({
        userId: user.id,
        conversationId: body.conversationId,
        message: body.message,
        projectId: body.projectId,
        model: body.model,
      });
      res.write(`data: ${JSON.stringify({ type: 'conversation', conversationId: context.conversationId })}\n\n`);

      // Stream the response
      const stream = this.orchestrator.executeStream({
        userId: user.id,
        message: body.message,
        conversationHistory: context.history,
        projectContext: context.projectContext,
        model: body.model,
      });

      let fullContent = '';
      let agentName: string | undefined;
      let sources: unknown;

      for await (const chunk of stream) {
        const data = JSON.stringify(chunk);
        res.write(`data: ${data}\n\n`);

        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content;
        }
        if (chunk.type === 'agent' && chunk.agentName) agentName = chunk.agentName;
        if (chunk.type === 'sources' && chunk.sources) sources = chunk.sources;
      }

      await this.chatService.completeStream({
        userId: user.id,
        conversationId: context.conversationId,
        content: fullContent,
        agentName,
        sources,
      });

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      const errorData = JSON.stringify({
        type: 'error',
        content: 'An error occurred while processing your request.',
      });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    }
  }

  @Get('conversations')
  async getConversations(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.chatService.getConversations(userId, page, pageSize);
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getMessages(id, userId);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.deleteConversation(id, userId);
  }
}
