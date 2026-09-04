import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'МегаМаркет — Публикуй объявления на все площадки одной кнопкой',
  description: 'Создай одно объявление — оно автоматически появится на Авито, Юле, OLX и других площадках',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
