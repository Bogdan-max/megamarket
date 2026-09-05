import { Controller, Get, Post, Param, Query, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlatformsService } from './platforms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

type AuthRequest = Express.Request & { user: { sub: string } };

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'https://frontend-pearl-alpha-61.vercel.app';

@ApiTags('Platforms')
@Controller('platforms')
export class PlatformsController {
  constructor(private platformsService: PlatformsService) {}

  @Get()
  @ApiOperation({ summary: 'Все доступные площадки' })
  async getAll() {
    return this.platformsService.getAll();
  }

  @Get('avito/auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'URL для подключения аккаунта Авито (OAuth2)' })
  async getAvitoAuthUrl(@Request() req: AuthRequest) {
    return this.platformsService.getAvitoAuthUrl(req.user.sub);
  }

  @Get('avito/callback')
  @ApiOperation({ summary: 'Callback OAuth2 от Авито' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: false, description: 'id пользователя' })
  async handleAvitoCallback(
    @Query('code') code: string,
    @Query('state') state?: string,
    @Res() res?: Response,
  ) {
    try {
      if (!code) throw new Error('Нет параметра code');
      const result = await this.platformsService.handleAvitoCallback(code, state);
      if (res) {
        res.redirect(`${FRONTEND_URL}/account/platforms?avito=${result.ok ? 'ok' : 'fail'}`);
        return;
      }
      return result;
    } catch (err: any) {
      if (res) {
        res.redirect(`${FRONTEND_URL}/account/platforms?avito=fail&error=${encodeURIComponent(err.message)}`);
        return;
      }
      return { ok: false, error: err.message };
    }
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