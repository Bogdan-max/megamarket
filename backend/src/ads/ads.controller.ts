import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthRequest = Express.Request & { user: { sub: string } };

@ApiTags('Ads')
@Controller('ads')
export class AdsController {
  constructor(private adsService: AdsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать объявление' })
  async create(@Request() req: AuthRequest, @Body() dto: any) {
    return this.adsService.create(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Список объявлений' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  async findAll(@Query() query: any) {
    return this.adsService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Мои объявления' })
  async myAds(@Request() req: AuthRequest) {
    return this.adsService.myAds(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Объявление по ID' })
  async findOne(@Param('id') id: string) {
    return this.adsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить объявление' })
  async update(@Param('id') id: string, @Request() req: AuthRequest, @Body() dto: any) {
    return this.adsService.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить объявление' })
  async remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.adsService.remove(id, req.user.sub);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'В избранное' })
  async toggleFavorite(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.adsService.toggleFavorite(req.user.sub, id);
  }
}
