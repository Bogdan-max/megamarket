'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { AdCard } from '@/components/AdCard';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PlatformBadge } from '@/components/PlatformBadge';

const CATEGORIES = [
  { id: 'electronics', icon: '📱', name: 'Электроника' },
  { id: 'auto', icon: '🚗', name: 'Авто' },
  { id: 'realestate', icon: '🏠', name: 'Недвижимость' },
  { id: 'clothes', icon: '👕', name: 'Одежда' },
  { id: 'home', icon: '🛋️', name: 'Дом и сад' },
  { id: 'jobs', icon: '💼', name: 'Работа' },
  { id: 'services', icon: '🔧', name: 'Услуги' },
  { id: 'other', icon: '📦', name: 'Другое' },
];

export default function HomePage() {
  const [ads, setAds] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchAds();
  }, [search, category, page]);

  async function fetchAds() {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    try {
      const res = await fetch(`/api/ads?${params}`);
      const data = await res.json();
      setAds(data.items || []);
      setTotal(data.total || 0);
    } catch {}
  }

  return (
    <div className="min-h-screen">
      <Header onCreateClick={() => setShowCreateModal(true)} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <SearchBar value={search} onChange={setSearch} />

        <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(category === cat.id ? '' : cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition
                ${category === cat.id
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-300'
                }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>

        {ads.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-xl">Пока нет объявлений</p>
            <p className="mt-2">Будь первым — создай объявление!</p>
          </div>
        )}
      </main>

      {showCreateModal && <CreateAdModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchAds(); }} />}
    </div>
  );
}

function CreateAdModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'electronics', city: '', images: [] as string[],
  });
  const [publishToAll, setPublishToAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'create' | 'publish' | 'done'>('create');
  const [result, setResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function aiGenerate() {
    if (!form.description && !form.title) {
      alert('Сначала опишите товар парой слов, чтобы ИИ мог улучшить объявление');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.title + ' ' + form.description }),
      });
      const analysis = await res.json();
      if (analysis.estimatedPrice && !form.price) setForm(f => ({ ...f, price: String(analysis.estimatedPrice) }));
      if (analysis.category) setForm(f => ({ ...f, category: analysis.category }));

      const genRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: analysis.category || form.category,
          price: analysis.estimatedPrice || form.price || undefined,
        }),
      });
      const gen = await genRes.json();
      if (gen.title) setForm(f => ({ ...f, title: gen.title }));
      if (gen.description) setForm(f => ({ ...f, description: gen.description }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, price: form.price ? Number(form.price) : undefined }),
      });
      const ad = await res.json();

      if (publishToAll && ad.id) {
        setStep('publish');
        const pubRes = await fetch(`/api/platforms/${ad.id}/publish-all`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        setResult(await pubRes.json());
      }

      setStep('done');
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {step === 'create' && '📝 Новое объявление'}
              {step === 'publish' && '🚀 Публикация на площадки...'}
              {step === 'done' && '✅ Готово!'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
        </div>

        {step === 'create' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <button
              type="button"
              onClick={aiGenerate}
              disabled={aiLoading}
              className="w-full flex items-center gap-2 justify-center px-4 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl transition disabled:opacity-50 hover:from-violet-600 hover:to-fuchsia-600"
            >
              <span>{aiLoading ? '⏳' : '✨'}</span>
              {aiLoading ? 'ИИ думает...' : '✨ Улучшить с помощью ИИ'}
            </button>

            <input
              type="text"
              placeholder="Заголовок"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              required
            />

            <textarea
              placeholder="Описание"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none resize-none"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Цена (₽)"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
              />
              <input
                type="text"
                placeholder="Город"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                required
              />
            </div>

            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>

            <label className="flex items-center gap-3 p-4 bg-brand-50 rounded-xl border border-brand-200 cursor-pointer">
              <input
                type="checkbox"
                checked={publishToAll}
                onChange={e => setPublishToAll(e.target.checked)}
                className="w-5 h-5 text-brand-500 rounded"
              />
              <div>
                <p className="font-semibold text-brand-800">🚀 Опубликовать на все площадки</p>
                <p className="text-sm text-brand-600">Авито, Юла, OLX, Мешок и другие</p>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold text-lg rounded-xl transition disabled:opacity-50 shadow-lg shadow-brand-200"
            >
              {loading ? '⏳ Создаю...' : '🚀 Опубликовать'}
            </button>
          </form>
        )}

        {step === 'publish' && (
          <div className="p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lg font-semibold">Публикуем на площадки...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-6xl mb-3">🎉</p>
              <p className="text-xl font-bold">Объявление создано!</p>
            </div>

            {result && (
              <div className="space-y-2">
                {result.map((r: any) => (
                  <div key={r.platform} className={`flex items-center gap-3 p-3 rounded-xl ${r.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <span>{r.success ? '✅' : '❌'}</span>
                    <span className="font-medium">{r.platform}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 font-semibold rounded-xl transition"
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
