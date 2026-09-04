import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const statusActive = 'ACTIVE';

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService) {}

  private serializeImages(images?: string[]) {
    return JSON.stringify(images || []);
  }

  private parseImages(images: string): string[] {
    try {
      return JSON.parse(images);
    } catch {
      return [];
    }
  }

  async create(dto: {
    title: string;
    description: string;
    price?: number;
    category: string;
    subcategory?: string;
    images?: string[];
    city: string;
    address?: string;
  }, authorId: string) {
    const { images, ...rest } = dto;
    const ad = await this.prisma.ad.create({
      data: { ...rest, images: this.serializeImages(images), authorId },
    });
    return { ...ad, images: this.parseImages(ad.images) };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    category?: string;
    city?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const { category, city, search } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const minPrice = query.minPrice ? Number(query.minPrice) : undefined;
    const maxPrice = query.maxPrice ? Number(query.maxPrice) : undefined;
    const where: Prisma.AdWhereInput = { status: statusActive };

    if (category) where.category = category;
    if (city) where.city = city;
    if (search) where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as any).gte = minPrice;
      if (maxPrice) (where.price as any).lte = maxPrice;
    }

    const [itemsRaw, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { favorites: true } },
        },
      }),
      this.prisma.ad.count({ where }),
    ]);

    const items = itemsRaw.map((ad: any) => ({ ...ad, images: this.parseImages(ad.images) }));

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const ad: any = await this.prisma.ad.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, phone: true, avatar: true } },
        publications: { include: { platform: true } },
        _count: { select: { favorites: true } },
      },
    });
    if (!ad) throw new NotFoundException('Объявление не найдено');

    await this.prisma.ad.update({ where: { id }, data: { views: { increment: 1 } } });
    return { ...ad, images: this.parseImages(ad.images) };
  }

  async update(id: string, userId: string, dto: Partial<{
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    city: string;
    status: string;
  }>) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Объявление не найдено');
    if (ad.authorId !== userId) throw new ForbiddenException('Нет доступа');

    const { images, ...rest } = dto;
    const data: any = { ...rest };
    if (images) data.images = this.serializeImages(images);

    const updated: any = await this.prisma.ad.update({ where: { id }, data });
    return { ...updated, images: this.parseImages(updated.images) };
  }

  async remove(id: string, userId: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Объявление не найдено');
    if (ad.authorId !== userId) throw new ForbiddenException('Нет доступа');

    await this.prisma.ad.delete({ where: { id } });
    return { success: true };
  }

  async myAds(userId: string) {
    const items = await this.prisma.ad.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        publications: { include: { platform: true } },
        _count: { select: { favorites: true } },
      },
    });
    return items.map((ad: any) => ({ ...ad, images: this.parseImages(ad.images) }));
  }

  async toggleFavorite(userId: string, adId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_adId: { userId, adId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { userId_adId: { userId, adId } } });
      return { favorited: false };
    } else {
      await this.prisma.favorite.create({ data: { userId, adId } });
      return { favorited: true };
    }
  }
}
