'use client';

import { Heart, Eye, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface AdCardProps {
  ad: {
    id: string;
    title: string;
    description: string;
    price?: number;
    images: string[];
    city: string;
    views: number;
    _count?: { favorites: number };
    publications?: { platform: { name: string }; status: string }[];
    author?: { name: string };
    createdAt: string;
  };
}

export function AdCard({ ad }: AdCardProps) {
  return (
    <Link
      href={`/ad/${ad.id}`}
      className="block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group cursor-pointer"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {ad.images?.[0] ? (
          <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">📷</div>
        )}
        <button
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition"
          onClick={(e) => { e.preventDefault(); }}
        >
          <Heart size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{ad.title}</h3>
          {ad.price != null && (
            <span className="text-lg font-bold text-brand-600 whitespace-nowrap">
              {ad.price.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ad.description}</p>

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-400">📍 {ad.city}</span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Eye size={12} />
            {ad.views}
          </div>
        </div>
      </div>
    </Link>
  );
}
