import { Module } from '@nestjs/common';
import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';
import { AdsModule } from '../ads/ads.module';

@Module({
  imports: [AdsModule],
  controllers: [PlatformsController],
  providers: [PlatformsService],
})
export class PlatformsModule {}
