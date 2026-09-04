# 🛒 МегаМаркет

**Universal Classified Ads Platform** — создаёшь **одно** объявление, публикуешь **одной кнопкой** на все площадки (Авито, Юла, OLX, Мешок и др.).

## 🏗️ Монорепозиторий

```
megamarket/
├── backend/    # NestJS + Prisma + PostgreSQL REST API
├── frontend/   # Next.js + Tailwind веб-приложение
├── mobile/     # React Native (Expo) мобильное приложение
└── shared/     # общие типы/утилиты (TODO)
```

## ✨ Ключевая фича

**Одна кнопка = публикация везде.**
Пользователь заполняет форму один раз → система автоматически публикует объявление во все подключённые площадки через адаптеры-интеграции. Статус каждой публикации отслеживается.

## 🚀 Запуск

### Быстрый старт (Windows, без Docker)
Дважды кликни **`start.bat`** — он установит зависимости, создаст SQLite-базу, зальёт тестовые данные и запустит сайт.

- **Сайт:** http://localhost:3000
- **Swagger API:** http://localhost:3001/api/docs
- **Демо-вход:** `demo@megamarket.ru` / `demo1234`

> База — **SQLite** (файл `backend/prisma/dev.db`), поэтому **Docker/PostgreSQL не нужны**.
> Хочешь PostgreSQL? Поменяй в `backend/.env` строку `DATABASE_URL` на `postgresql://...` — Prisma это поддержит.

### Вручную

**Backend (порт 3001)**
```bash
cd backend
npm install
npx prisma migrate dev --name init   # создать SQLite-БД
npx prisma db seed                   # тестовые данные
npm run start:dev
```

**Frontend (порт 3000)**
```bash
cd frontend
npm install
npm run dev
```
`/api` на frontend проксируется на backend (`next.config.js`).

### Mobile (Expo)
```bash
cd mobile
npm install --legacy-peer-deps
npm run start   # затем сканировать QR в Expo Go (нужен телефон с Expo Go и один LAN)
```

## 🤖 ИИ-ассистент

Работает на OpenAI-совместимом API. Без ключа — включает режим эвристики (категории/цену определяет по ключевым словам).

```env
AI_API_KEY="sk-..."        # ключ OpenAI / Mistral / GigaChat
AI_BASE_URL=""             # для альтернативных провайдеров
AI_MODEL="gpt-4o-mini"
```

Возможности (эндпоинты `/api/ai`):
- `generate` — генерирует заголовок и описание
- `analyze` — определяет категорию и цену по тексту
- `market` — оценка справедливой цены + советы по продаже
- `chat` — ИИ-ответ покупателю по объявлению

## 🧩 Архитектура

### Backend модули
| Модуль | Назначение |
|--------|-----------|
| `auth` | JWT регистрация/вход/профиль |
| `ads` | CRUD объявлений, фильтры, избранное |
| `platforms` | Адаптеры площадок + публикация на все |
| `upload` | Загрузка изображений (Multer) |
| `ai` | ИИ-ассистент (генерация, анализ, рынок, чат) |

### Модель данных (Prisma)
- **User** — аккаунт
- **Ad** — объявление (status: DRAFT/ACTIVE/PUBLISHED/SOLD)
- **Platform** — доступные площадки
- **PlatformPublication** — статус публикации на каждой площадке
- **PlatformAuth** — токены доступа пользователя к площадке
- **Favorite** — избранное

## 🔌 Добавление новой площадки

В `backend/src/platforms/platforms.service.ts` зарегистрируй адаптер:

```ts
this.adapters.set('my_platform', {
  name: 'Моя площадка', url: 'https://...', icon: '🟢',
  publish: async (ad, auth) => { /* API-вызов */ return { platformAdId: '...' }; },
  checkAuth: async (auth) => !!auth?.accessToken,
});
```

## 📋 Планы

- [ ] Реальные API-интеграции с площадками
- [ ] Чат продавец/покупатель
- [ ] Встроенная оплата
- [ ] Геолокация и карта объявлений
- [ ] Уведомления о новых объявлениях
- [ ] Рейтинги и отзывы продавцов
