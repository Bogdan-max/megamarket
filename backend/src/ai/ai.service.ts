import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const CATEGORY_HINT: Record<string, string> = {
  electronics: 'Электроника (техника, гаджеты, компьютеры, телефоны)',
  auto: 'Авто (машины, мото, запчасти)',
  realestate: 'Недвижимость (квартиры, дома, коммерция)',
  clothes: 'Одежда и аксессуары',
  home: 'Дом и сад (мебель, ремонт, огород)',
  jobs: 'Работа и вакансии',
  services: 'Услуги',
  other: 'Другое',
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get('AI_API_KEY');
    const baseURL = this.config.get('AI_BASE_URL');
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: baseURL || undefined,
      });
    } else {
      this.logger.warn('AI_API_KEY не задан — ИИ работает в режиме эвристики (без LLM)');
    }
  }

  private get enabled() {
    return !!this.client;
  }

  private async call(system: string, user: string, json = true) {
    if (!this.client) throw new Error('ИИ не настроен (нет AI_API_KEY)');
    const res = await this.client.chat.completions.create({
      model: this.config.get('AI_MODEL', 'gpt-4o-mini'),
      temperature: 0.7,
      response_format: json ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error('ИИ не вернул ответ');
    return content;
  }

  /** Генерация заголовка и описания по исходным данным */
  async generateAd(input: { title?: string; description?: string; category?: string; price?: number; tone?: string }) {
    const json = await this.call(
      'Ты — ассистент площадки объявлений. Пиши на русском, товарно, убедительно, без воды. Верни JSON: {"title","description"}.',
      `Данные для объявления: ${JSON.stringify(input)}. Заполни заголовок и описание, придумав недостающее разумно. Стиль: ${input.tone || 'дружелюбный'}.`,
    );
    return JSON.parse(json);
  }

  /** Подбор категории и примерной цены из свободного текста/фото-описания */
  async analyze(input: { text: string }) {
    if (!this.enabled) {
      return this.heuristicAnalyze(input.text);
    }
    try {
      const json = await this.call(
        `Ты — аналитик. Определи категорию строго из списка и ориентировочную цену. Верни JSON: {"category":"one_of_${Object.keys(CATEGORY_HINT).join('|')}","estimatedPrice":число,"keywords":[строки]}. Если цена неясна — estimatedPrice: null.`,
        `Описание товара: "${input.text}"`,
      );
      return JSON.parse(json);
    } catch {
      return this.heuristicAnalyze(input.text);
    }
  }

  /** Анализ рынка: конкурентная цена и советы по продаже */
  async marketAdvice(input: { title: string; category?: string; price?: number }) {
    if (!this.enabled) {
      return this.heuristicMarketAdvice(input);
    }
    try {
      const json = await this.call(
        'Ты — эксперт по рынку перепродаж. Верни JSON: {"fairPrice":число|null,"range":{"min":число,"max":число},"tips":[строки]}. Советы конкретные и по делу.',
        `Товар: "${input.title}" (категория: ${CATEGORY_HINT[input.category || ''] || input.category}). Текущая цена: ${input.price || 'не указана'}`,
      );
      return JSON.parse(json);
    } catch {
      return this.heuristicMarketAdvice(input);
    }
  }

  /** Ответ ИИ-ассистента покупателю / чат-бот */
  async chat(input: { ad?: any; message: string }) {
    if (!this.enabled) {
      return {
        reply: `Здравствуйте! Спасибо за интерес к "${input.ad?.title || 'объявлению'}". Подскажу детали. Вы спрашивали: "${input.message}"`,
      };
    }
    const json = await this.call(
      'Ты — вежливый ассистент продавца на площадке объявлений. Отвечай кратко и по делу, предлагай оформить сделку. Верни JSON: {"reply": "..."}',
      `Контекст объявления: ${JSON.stringify(input.ad || {})}. Сообщение покупателя: "${input.message}"`,
    );
    return JSON.parse(json);
  }

  /** Заглушки-эвристики, если LLM не настроена */
  private heuristicAnalyze(text: string) {
    const t = text.toLowerCase();
    let category = 'other';
    if (/(телефон|iphone|samsung|ноут|комп|планшет|наушник|тверд|ssd|монитор)/.test(t)) category = 'electronics';
    else if (/(машин|авто|мото|мотор|шина|гараж)/.test(t)) category = 'auto';
    else if (/(квартир|дом| комнат|студи|дача|участок)/.test(t)) category = 'realestate';
    else if (/(куртк|пальто|джинс|ботинк|кроссовк|платье|футболк|одежд|чемудан)/.test(t)) category = 'clothes';
    else if (/(диван|стол|мебель|холодильник|стирал|телевизор|пылесос)/.test(t)) category = 'home';
    const kmatch = t.match(/(\d[\d ]{1,7})\s*(₽|руб|р\.)/);
    const estimatedPrice = kmatch ? parseInt(kmatch[1].replace(/\s/g, ''), 10) : null;
    return { category, estimatedPrice, keywords: t.split(/\s+/).filter(w => w.length > 4).slice(0, 8) };
  }

  private heuristicMarketAdvice(input: { title: string; category?: string; price?: number }) {
    const base = { fairPrice: input.price ?? null, range: { min: null, max: null }, tips: [] as string[] };
    base.tips.push('Сделайте качественные фото при дневном свете — это повышает отклики на 60%');
    base.tips.push('Укажите точную марку, модель и состояние в заголовке');
    base.tips.push('Отвечайте покупателям в течение 10 минут — быстрые ответы повышают доверие');
    return base;
  }
}
