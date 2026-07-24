import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators';

@Controller('health')
export class AppController {
  @Public()
  @Get()
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
