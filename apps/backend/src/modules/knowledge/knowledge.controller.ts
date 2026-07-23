// ============================================
// ContentPilot AI — Knowledge Controller
// ============================================

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeService } from './knowledge.service';
import { CurrentUser } from '../../common/decorators';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'documents'),
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/markdown',
          'text/csv',
        ];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  async uploadDocument(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
  ) {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'text/plain': 'TXT',
      'text/markdown': 'MARKDOWN',
      'text/csv': 'CSV',
    };

    return this.knowledgeService.createDocument({
      userId,
      title: title || file.originalname,
      type: typeMap[file.mimetype] || 'TXT',
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
  }

  @Post('scrape')
  async scrapeUrl(
    @CurrentUser('id') userId: string,
    @Body() body: { url: string; title?: string },
  ) {
    return this.knowledgeService.createDocument({
      userId,
      title: body.title || body.url,
      type: 'URL',
      sourceUrl: body.url,
    });
  }

  @Get('documents')
  async getDocuments(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.knowledgeService.getDocuments(userId, page, pageSize);
  }

  @Delete('documents/:id')
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.knowledgeService.deleteDocument(id, userId);
  }
}
