import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdsModule } from './ads/ads.module';
import { PlatformsModule } from './platforms/platforms.module';
import { UploadModule } from './upload/upload.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AdsModule,
    PlatformsModule,
    UploadModule,
    AiModule,
  ],
})
export class AppModule {}
