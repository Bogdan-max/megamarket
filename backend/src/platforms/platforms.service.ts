import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdsService } from '../ads/ads.service';

interface PlatformAdapter {
  name: string;
  url: string;
  icon: string;
  publish: (ad: any, auth: any) => Promise<{ platformAdId: string }>;
  checkAuth: (auth: any) => Promise<boolean>;
}

@Injectable()
export class PlatformsService {
  private adapters: Map<string, PlatformAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private adsService: AdsService,
  ) {
    this.registerAdapters();
  }

  private registerAdapters() {
    this.adapters.set('avito', {
      name: 'Авито',
      url: 'https://avito.ru',
      icon: '🟠',
      publish: async (ad, auth) => {
        // Реальная интеграция подключается через API площадки
        console.log(`Публикация на Авито: ${ad.title}`);
        return { platformAdId: `avito_${Date.now()}` };
      },
      checkAuth: async (auth) => !!auth?.accessToken,
    });

    this.adapters.set('yula', {
      name: 'Юла',
      url: 'https://yula.ru',
      icon: '🟣',
      publish: async (ad, auth) => {
        console.log(`Публикация на Юле: ${ad.title}`);
        return { platformAdId: `yula_${Date.now()}` };
      },
      checkAuth: async (auth) => !!auth?.accessToken,
    });

    this.adapters.set('olx', {
      name: 'OLX',
      url: 'https://olx.ru',
      icon: '🔵',
      publish: async (ad, auth) => {
        console.log(`Публикация на OLX: ${ad.title}`);
        return { platformAdId: `olx_${Date.now()}` };
      },
      checkAuth: async (auth) => !!auth?.accessToken,
    });

    this.adapters.set('meshok', {
      name: 'Мешок',
      url: 'https://meshok.net',
      icon: '🟡',
      publish: async (ad, auth) => {
        console.log(`Публикация на Мешке: ${ad.title}`);
        return { platformAdId: `meshok_${Date.now()}` };
      },
      checkAuth: async (auth) => !!auth?.accessToken,
    });
  }

  async getAll() {
    return Array.from(this.adapters.entries()).map(([key, adapter]) => ({
      id: key,
      name: adapter.name,
      url: adapter.url,
      icon: adapter.icon,
    }));
  }

  async publishToOne(adId: string, platformId: string, userId: string) {
    const ad = await this.adsService.findOne(adId);
    const adapter = this.adapters.get(platformId);
    if (!adapter) throw new NotFoundException(`Платформа ${platformId} не найдена`);

    const auth = await this.prisma.platformAuth.findUnique({
      where: { userId_platform: { userId, platform: platformId } },
    });

    const publication = await this.prisma.platformPublication.create({
      data: {
        adId,
        platformId: (await this.prisma.platform.upsert({
          where: { name: platformId },
          update: {},
          create: { name: platformId, url: adapter.url, icon: adapter.icon },
        })).id,
        status: 'PUBLISHING',
      },
    });

    try {
      const result = await adapter.publish(ad, auth);
      const updated = await this.prisma.platformPublication.update({
        where: { id: publication.id },
        data: { status: 'SUCCESS', platformAdId: result.platformAdId, publishedAt: new Date() },
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
