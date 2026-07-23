// ============================================
// ContentPilot AI — Projects Controller
// ============================================

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../../common/decorators';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: {
      name: string;
      description?: string;
      industry?: string;
      niche?: string;
      brandVoice?: string;
      targetAudience?: string;
    },
  ) {
    return this.projectsService.create(userId, body);
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.projectsService.findAllByUser(userId, page, pageSize);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.findById(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: {
      name?: string;
      description?: string;
      industry?: string;
      niche?: string;
      brandVoice?: string;
      targetAudience?: string;
    },
  ) {
    return this.projectsService.update(id, userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.delete(id, userId);
  }
}
