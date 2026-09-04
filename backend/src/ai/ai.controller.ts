import { Controller, Post, Body, UseGuards, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Сгенерировать заголовок/описание объявления' })
  async generate(@Body() dto: { title?: string; description?: string; category?: string; price?: number; tone?: string }) {
    return this.aiService.generateAd(dto);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Подобрать категорию и цену по описанию' })
  async analyze(@Body() dto: { text: string }) {
    return this.aiService.analyze(dto);
  }

  @Post('market')
  @ApiOperation({ summary: 'Анализ рынка: цена и советы по продаже' })
  async market(@Body() dto: { title: string; category?: string; price?: number }) {
    return this.aiService.marketAdvice(dto);
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ИИ-чат с покупателем' })
  async chat(@Body() dto: { ad?: any; message: string }) {
    return this.aiService.chat(dto);
  }
}
