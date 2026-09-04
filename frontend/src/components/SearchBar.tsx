'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        placeholder="Найти что угодно..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none shadow-sm transition"
      />
    </div>
  );
}
