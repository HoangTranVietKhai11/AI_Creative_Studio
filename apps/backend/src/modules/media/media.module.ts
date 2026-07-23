import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@contentpilot/shared';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.MEDIA_ANALYSIS }),
  ],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
