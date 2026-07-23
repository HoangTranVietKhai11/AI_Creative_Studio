// ============================================
// ContentPilot AI — Users Controller
// ============================================

import { Controller, Get, Put, Post, Delete, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; avatarUrl?: string; preferredModel?: string },
  ) {
    return this.usersService.updateProfile(userId, body);
  }

  @Post('api-key')
  async setApiKey(
    @CurrentUser('id') userId: string,
    @Body() body: { apiKey: string },
  ) {
    await this.usersService.setApiKey(userId, body.apiKey);
    return { message: 'API key saved successfully' };
  }

  @Get('api-key')
  async hasApiKey(@CurrentUser('id') userId: string) {
    const hasKey = await this.usersService.hasApiKey(userId);
    return { hasApiKey: hasKey };
  }

  @Delete('api-key')
  async deleteApiKey(@CurrentUser('id') userId: string) {
    await this.usersService.deleteApiKey(userId);
    return { message: 'API key removed' };
  }
}
