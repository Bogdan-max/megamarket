import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function pubId(adId: string, platformId: string) {
  return adId + '-' + platformId;
}

async function main() {
const platformNames = ['avito', 'yula', 'olx', 'meshok'];
  const platformUrls: Record<string, string> = {
    avito: 'https://avito.ru',
    yula: 'https://yula.ru',
    olx: 'https://olx.ru',
    meshok: 'https://meshok.net',
  };
  const platforms: { id: string; name: string }[] = [];
  for (const name of platformNames) {
    const row = await prisma.platform.upsert({
      where: { name },
      update: { url: platformUrls[name] },
      create: { name, url: platformUrls[name] },
    });
    platforms.push({ id: row.id, name: row.name });
  }

  const hashed = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@megamarket.ru' },
    update: { name: 'Демо Пользователь', phone: '+7 900 123-45-67', city: 'Москва' },
    create: {
      email: 'demo@megamarket.ru',
      name: 'Демо Пользователь',
      password: hashed,
      city: 'Москва',
      phone: '+7 900 123-45-67',
    },
  });

  const sampleAds = [
    {
      id: 'seed-iphone',
      title: 'iPhone 15 Pro 256GB — в отличном состоянии',
      description: 'Купил в ноябре, пользовался в чехле и со стеклом. Батарея 100% (220 циклов). Полный комплект: коробка, документация, кабель. Цвет — натуральный титан. Не битый, не ремонтировался. Возможен торг при встрече у метро, проверка в любом сервисе.',
      price: 85000,
      category: 'electronics',
      city: 'Москва',
      images: [
        'https://picsum.photos/seed/iphone15a/800/600',
        'https://picsum.photos/seed/iphone15b/800/600',
        'https://picsum.photos/seed/iphone15c/800/600',
      ],
    },
    {
      id: 'seed-div',
      title: 'Диван угловой «Манхэттен», новый',
      description: 'Продаю совершенно новый диван — не подошёл под размер комнаты. Обивка — мягкий велюр, механизм еврокнижка, ткань не маркая, каркас из берёзы. В наличии чек и гарантия 2 года. Самовывоз с СПб или отправка транспортной компанией в любой регион.',
      price: 32000,
      category: 'home',
      city: 'Санкт-Петербург',
      images: [
        'https://picsum.photos/seed/divan_a/800/600',
        'https://picsum.photos/seed/divan_b/800/600',
      ],
    },
    {
      id: 'seed-camry',
      title: 'Toyota Camry 2021, пробег 45 000 км',
      description: 'Один владелец по ПТС, весь сервис у официального дилера, есть сервисная книжка и чеки. Комплектация Элеганс Плюс: климат-контроль, камера, подогревы, штатная мультимедиа. Без ДТП и окрасов, пробег подтверждён дилером. Возможен обмен с доплатой, поможем с проверкой на любом СТО.',
      price: 2450000,
      category: 'auto',
      city: 'Казань',
      images: [
        'https://picsum.photos/seed/camry1/800/600',
        'https://picsum.photos/seed/camry2/800/600',
        'https://picsum.photos/seed/camry3/800/600',
      ],
    },
    {
      id: 'seed-studio',
      title: 'Студия 25 м² с ремонтом в ЖК «Весна»',
      description: 'Светлая студия с отделкой под ключ, дом сдан, заезд сразу. Кухня-гостиная с панорамными окнами, тёплый пол в санузле. Все документы готовы, подходит ипотека и материнский капитал. Показ в удобное для вас время, торг при быстрой сделке.',
      price: 6900000,
      category: 'realestate',
      city: 'Екатеринбург',
      images: [
        'https://picsum.photos/seed/kv1/800/600',
        'https://picsum.photos/seed/kv2/800/600',
        'https://picsum.photos/seed/kv3/800/600',
      ],
    },
  ];

  for (const ad of sampleAds) {
    await prisma.ad.upsert({
      where: { id: ad.id },
      update: {
        title: ad.title,
        description: ad.description,
        price: ad.price,
        category: ad.category,
        city: ad.city,
        status: 'ACTIVE',
        images: JSON.stringify(ad.images),
      },
      create: {
        id: ad.id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        category: ad.category,
        city: ad.city,
        status: 'ACTIVE',
        images: JSON.stringify(ad.images),
        authorId: user.id,
      },
    });

    for (const p of platforms) {
      await prisma.platformPublication.upsert({
        where: { id: pubId(ad.id, p.id) },
        update: {
          status: 'SUCCESS',
          platformAdId: p.id + '_' + ad.id,
          platformId: p.id,
        },
        create: {
          id: pubId(ad.id, p.id),
          adId: ad.id,
          platformId: p.id,
          status: 'SUCCESS',
          platformAdId: p.id + '_' + ad.id,
        },
      });
    }
  }

  const count = await prisma.ad.count();
  const pubCount = await prisma.platformPublication.count();
  console.log('SEED_DONE ads=' + count + ' pubs=' + pubCount);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
