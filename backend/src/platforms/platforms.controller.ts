import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformsService } from './platforms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthRequest = Express.Request & { user: { sub: string } };

@ApiTags('Platforms')
@Controller('platforms')
export class PlatformsController {
  constructor(private platformsService: PlatformsService) {}

  @Get()
  @ApiOperation({ summary: 'Все доступные площадки' })
  async getAll() {
    return this.platformsService.getAll();
  }

  @Post(':adId/publish/:platformId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Опубликовать на одной площадке' })
  async publishToOne(@Param('adId') adId: string, @Param('platformId') platformId: string, @Request() req: AuthRequest) {
    return this.platformsService.publishToOne(adId, platformId, req.user.sub);
  }

  @Post(':adId/publish-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Опубликовать на ВСЕ площадки одной кнопкой' })
  async publishToAll(@Param('adId') adId: string, @Request() req: AuthRequest) {
    return this.platformsService.publishToAll(adId, req.user.sub);
  }

  @Get(':adId/publications')
  @ApiOperation({ summary: 'Статус публикаций объявления' })
  async getPublications(@Param('adId') adId: string) {
    return this.platformsService.getPublications(adId);
  }
}
