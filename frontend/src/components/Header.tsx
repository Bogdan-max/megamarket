'use client';

import { Plus, User, Heart } from 'lucide-react';

interface HeaderProps {
  onCreateClick: () => void;
}

export function Header({ onCreateClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            МегаМаркет
          </h1>
          <span className="hidden sm:block text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            Все площадки в одном месте
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition">
            <Heart size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition">
            <User size={20} />
          </button>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition shadow-md shadow-brand-200"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Подать объявление</span>
          </button>
        </div>
      </div>
    </header>
  );
}
