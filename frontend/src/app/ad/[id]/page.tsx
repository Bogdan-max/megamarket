'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, ChevronLeft, Eye, MapPin, User, Calendar } from 'lucide-react';

export default function AdDetailPage({ params }: { params: { id: string } }) {
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetch(`/api/ads/${params.id}`)
      .then(r => r.json())
      .then(data => { setAd(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-6xl mb-4">😕</p>
          <p className="text-xl font-semibold text-gray-700">Объявление не найдено</p>
          <Link href="/" className="inline-block mt-6 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold transition">
            ← На главную
          </Link>
        </div>
      </div>
    );
  }

  const images = ad.images?.length ? ad.images : [];
  const price = ad.price != null ? ad.price.toLocaleString('ru-RU') + ' ₽' : 'Цена не указана';
  const phone = ad.author?.phone || '+7 (900) 000-00-00';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-brand-600">
            <ChevronLeft size={20} />
            <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">МегаМаркет</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-brand-600">← Все объявления</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Галерея */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="aspect-[4/3] bg-gray-100 relative">
                {images.length > 0 ? (
                  <img src={images[activeImage]} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl text-gray-300">📷</span>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${i === activeImage ? 'border-brand-500' : 'border-transparent'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Описание</h2>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">{ad.description}</p>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-400">
                <Eye size={15} />
                <span>{ad.views} просмотров</span>
                <span className="ml-4 flex items-center gap-1">
                  <Calendar size={15} />
                  {new Date(ad.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>

          {/* Правая колонка: цена + продавец */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{ad.title}</h1>
              <p className="text-2xl font-bold text-brand-600 mt-3">{price}</p>
              <p className="flex items-center gap-1 text-gray-500 mt-2">
                <MapPin size={16} />
                {ad.city}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2">
                <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                   className="flex items-center justify-center gap-2 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition">
                  <Phone size={20} />
                  Позвонить
                </a>
                <a href={`sms:${phone.replace(/[^0-9+]/g, '')}`}
                   className="flex items-center justify-center gap-2 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-bold rounded-xl transition">
                  <MessageCircle size={20} />
                  Написать
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
                  {(ad.author?.name || 'П').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                    {ad.author?.name || 'Продавец'}
                    <User size={14} className="text-gray-400" />
                  </p>
                  <p className="text-sm text-gray-500">На МегаМаркет с {new Date().getFullYear()} года</p>
                </div>
              </div>

              {ad.publications && ad.publications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Опубликовано на площадках:</p>
                  <div className="flex flex-wrap gap-2">
                    {ad.publications.map((pub: any, i: number) => (
                      <span key={i} className={`text-xs px-3 py-1 rounded-full border ${
                        pub.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' :
                        pub.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {pub.platform?.name || pub.platformId} • {pub.status === 'SUCCESS' ? '✓' : pub.status}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/" className="block text-center text-sm text-gray-500 hover:text-brand-600 py-2">
              ← Вернуться к поиску
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
