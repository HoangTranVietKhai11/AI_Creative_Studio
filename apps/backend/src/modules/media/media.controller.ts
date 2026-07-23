// ============================================
// ContentPilot AI — Media Controller
// ============================================

import {
  Controller, Get, Post, Delete, Param, Query, Body,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MediaService } from './media.service';
import { CurrentUser } from '../../common/decorators';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'media'),
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'video/quicktime',
        ];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  async upload(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const type = file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO';

    const media = await this.mediaService.createUpload({
      userId,
      type: type as 'IMAGE' | 'VIDEO',
      filename: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    // Auto-trigger analysis
    await this.mediaService.triggerAnalysis(media.id, userId);

    return media;
  }

  @Post(':id/analyze')
  async analyze(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mediaService.triggerAnalysis(id, userId);
  }

  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.mediaService.getMedia(userId, page, pageSize);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mediaService.getMediaById(id, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mediaService.deleteMedia(id, userId);
  }
}
