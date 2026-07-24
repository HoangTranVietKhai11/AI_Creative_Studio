import { Controller, Get, Put, Param, Query, UseGuards, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService, // Need this to access DB directly
  ) {}

  // 🚀 TEMP ROUTE: Tự động cấp quyền admin cho khaih3222@gmail.com
  @Get('setup-first-admin')
  async setupFirstAdmin() {
    const email = 'khaih3222@gmail.com';
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, message: 'Bạn chưa tạo tài khoản. Hãy vào web đăng ký tài khoản với email khaih3222@gmail.com trước nhé!' };
    }
    await this.prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    return { success: true, message: 'Thành công! Tài khoản của bạn đã được nâng cấp lên ADMIN.' };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 10;
    return this.adminService.getUsers(p, ps);
  }

  @Put('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: 'USER' | 'ADMIN',
  ) {
    return this.adminService.updateUserRole(id, role);
  }
}
