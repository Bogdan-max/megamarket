import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AdsService } from '../ads/ads.service';
import { AvitoAdapter, AvitoError, AvitoToken } from './avito.adapter';
import { AVITO_CATEGORY_MAP, buildAvitoPayload } from './avito.helpers';

interface PlatformAdapter {
  name: string;
  url: string;
  icon: string;
  integration: 'real' | 'mock';
  note?: string;
  publish: (ad: any, auth: any) => Promise<{ platformAdId: string; url?: string }>;
  checkAuth: (auth: any) => Promise<boolean>;
}

@Injectable()
export class PlatformsService {
  private adapters: Map<string, PlatformAdapter> = new Map();
  private avito: AvitoAdapter | null = null;

  constructor(
    private prisma: PrismaService,
    private adsService: AdsService,
    private config: ConfigService,
  ) {
    this.initAvito();
    this.registerAdapters();
  }

  private initAvito() {
    const clientId = this.config.get('AVITO_CLIENT_ID');
    const clientSecret = this.config.get('AVITO_CLIENT_SECRET');
    const redirectUri =
      this.config.get('AVITO_REDIRECT_URI') ||
      'https://megamarket-api-production.up.railway.app/api/platforms/avito/callback';
    if (clientId && clientSecret) {
      this.avito = new AvitoAdapter({ clientId, clientSecret, redirectUri });
    }
  }

  private registerAdapters() {
    this.adapters.set('avito', {
      name: 'Авито',
      url: 'https://avito.ru',
      icon: '🟠',
      integration: this.avito ? 'real' : 'mock',
      note: this.avito ? 'официальный API продавца' : 'нет ключей AVITO_CLIENT_ID/SECRET',
      publish: async (ad, auth) => {
        if (!this.avito) throw new Error('Авито не подключено: задайте AVITO_CLIENT_ID и AVITO_CLIENT_SECRET');
        if (!auth?.accessToken) throw new Error('Аккаунт Авито не подключён пользователем');
        const token = await this.ensureFreshToken('avito', auth);
        return this.publishToAvito(ad, token.accessToken, auth);
      },
      checkAuth: async (auth) => !!auth?.accessToken,
    });

    this.adapters.set('yula', {
      name: 'Юла',
      url: 'https://yula.ru',
      icon: '🟣',
      integration: 'mock',
      note: 'официального публичного API нет',
      publish: async (ad, auth) => {
        console.log(`[mock] Публикация на Юле: ${ad.title}`);
        return { platformAdId: `yula_${Date.now()}` };
      },
      checkAuth: async (auth) => !!auth?.accessToken,
    });

    this.adapters.set('olx', {
      name: 'OLX',
      url: 'https://olx.ru',
      icon: '🔵',
      integration: 'mock',
      note: 'OLX ушёл из РФ, API отсутствует',
      publish: async (ad, auth) => {
        console.log(`[mock] Публикация на OLX: ${ad.title}`);
        return { platformAdId: `olx_${Date.now()}` };
      },
      checkAuth: async (auth) => !!auth?.accessToken,
    });

    this.adapters.set('meshok', {
      name: 'Мешок',
      url: 'https://meshok.net',
      icon: '🟡',
      integration: 'mock',
      note: 'API продавца выдаётся по заявке',
      publish: async (ad, auth) => {
        console.log(`[mock] Публикация на Мешке: ${ad.title}`);
        return { platformAdId: `meshok_${Date.now()}` };
      },
      checkAuth: async (auth) => !!auth?.accessToken,
    });
  }

  private async publishToAvito(ad: any, accessToken: string, auth: any) {
    const map = AVITO_CATEGORY_MAP[ad.category] || { id: 31, keywords: 'телефоны' };

    const photoIds: string[] = [];
    const images = Array.isArray(ad.images) ? ad.images : [];
    for (const url of images.slice(0, 6)) {
      try {
        const photoId = await this.avito!.uploadPhoto(accessToken, url);
        if (photoId) photoIds.push(photoId);
      } catch (err: any) {
        console.warn(`[avito] пропускаем фото ${url}: ${err.message}`);
      }
    }

    const phone = auth?.userPhone || (ad.author?.phone) || '';
    const payload = buildAvitoPayload({
      ad,
      map,
      contactName: auth?.userName || (ad.author?.name) || 'Продавец',
      contactPhone: phone,
      condition: 'used',
      photoIds,
    });

    try {
      const item = await this.avito!.createItem(accessToken, payload);
      return { platformAdId: item.id, url: item.url };
    } catch (err) {
      if (err instanceof AvitoError) {
        const requireFields = await this.avito!.getRequireFields(accessToken, map.id).catch(() => null);
        if (requireFields) {
          // Попробуем достроить обязательные поля и повторить — на практике хватает базового payload,
          // поэтому пока просто прокинем сообщение с подсказкой.
          throw new AvitoError(
            `${err.message}. Обязательные поля категории: ${JSON.stringify(requireFields).slice(0, 400)}`,
            err.status,
            err.body,
          );
        }
      }
      throw err;
    }
  }

  private async ensureFreshToken(platformId: string, auth: any): Promise<AvitoToken> {
    if (!this.avito) throw new Error('Авито не настроено');
    const now = Date.now();
    if (auth.expiresAt && new Date(auth.expiresAt).getTime() > now + 60_000) {
      return {
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        expiresAt: auth.expiresAt,
      };
    }

    if (!auth.refreshToken) {
      throw new Error('Токен Авито истёк, а refresh_token отсутствует. Переподключите аккаунт.');
    }

    const refreshed = await this.avito.refreshToken(auth.refreshToken);
    await this.prisma.platformAuth.update({
      where: { userId_platform: { userId: auth.userId, platform: platformId } },
      data: {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      },
    });
    return refreshed;
  }

  async getAll() {
    const rows = Array.from(this.adapters.entries()).map(([key, adapter]) => ({
      id: key,
      name: adapter.name,
      url: adapter.url,
      icon: adapter.icon,
      integration: adapter.integration,
      note: adapter.note,
    }));
    return rows;
  }

  getAvito(): AvitoAdapter | null {
    return this.avito;
  }

  async getAvitoAuthUrl(userId: string) {
    if (!this.avito) {
      throw new BadRequestException('Авито не настроено: задайте AVITO_CLIENT_ID и AVITO_CLIENT_SECRET');
    }
    return { url: this.avito.getAuthUrl(userId) };
  }

  async handleAvitoCallback(code: string, state?: string) {
    if (!this.avito) throw new BadRequestException('Авито не настроено');
    const userId = state || (await this.resolveUserFromCode(code));

    const redirectUri =
      this.config.get('AVITO_REDIRECT_URI') ||
      'https://megamarket-api-production.up.railway.app/api/platforms/avito/callback';

    let token: AvitoToken;
    try {
      token = await this.avito.exchangeCode(code, redirectUri);
    } catch (err) {
      throw new BadRequestException(`Не удалось обменять код Авито: ${(err as any)?.message}`);
    }

    if (!userId) throw new BadRequestException('Не указан пользователь (state)');

    await this.prisma.platformAuth.upsert({
      where: { userId_platform: { userId, platform: 'avito' } },
      update: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt,
      },
      create: {
        userId,
        platform: 'avito',
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt,
      },
    });

    return { ok: true, platform: 'avito' };
  }

  private async resolveUserFromCode(code: string): Promise<string | null> {
    const existing = await this.prisma.platformAuth.findFirst({
      where: { platform: 'avito' },
      orderBy: { createdAt: 'desc' },
    });
    return existing?.userId || null;
  }

  async publishToOne(adId: string, platformId: string, userId: string) {
    const ad = await this.adsService.findOne(adId);
    const adapter = this.adapters.get(platformId);
    if (!adapter) throw new NotFoundException(`Платформа ${platformId} не найдена`);

    const auth: any = await this.prisma.platformAuth.findUnique({
      where: { userId_platform: { userId, platform: platformId } },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const authWithUser = auth
      ? { ...auth, userName: user?.name, userPhone: user?.phone }
      : null;

    const platform = await this.prisma.platform.upsert({
      where: { name: platformId },
      update: {},
      create: { name: platformId, url: adapter.url, icon: adapter.icon },
    });

    const publication = await this.prisma.platformPublication.create({
      data: {
        adId,
        platformId: platform.id,
        status: 'PUBLISHING',
      },
    });

    try {
      const result = await adapter.publish(ad, authWithUser || {});
      const updated = await this.prisma.platformPublication.update({
        where: { id: publication.id },
        data: {
          status: 'SUCCESS',
          platformAdId: result.platformAdId,
          publishedAt: new Date(),
          error: result.url ? `Опубликовано: ${result.url}` : null,
        },
      });
      return { success: true, publication: updated };
    } catch (error: any) {
      const updated = await this.prisma.platformPublication.update({
        where: { id: publication.id },
        data: { status: 'FAILED', error: (error && error.message) || String(error) },
      });
      return { success: false, error: (error && error.message) || String(error), publication: updated };
    }
  }

  async publishToAll(adId: string, userId: string) {
    const platformIds = Array.from(this.adapters.keys());
    const results = await Promise.allSettled(
      platformIds.map(pid => this.publishToOne(adId, pid, userId)),
    );

    return results.map((r, i) => ({
      platform: platformIds[i],
      ...((r.status === 'fulfilled') ? r.value : { success: false, error: (r.reason && r.reason.message) || String(r.reason) }),
    }));
  }

  async getPublications(adId: string) {
    return this.prisma.platformPublication.findMany({
      where: { adId },
      include: { platform: true },
    });
  }
}