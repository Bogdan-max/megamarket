'use client';

interface CategoryFilterProps {
  categories: { id: string; icon: string; name: string }[];
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(selected === cat.id ? '' : cat.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition
            ${selected === cat.id
              ? 'bg-brand-500 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-300'
            }`}
        >
          <span>{cat.icon}</span>
          {cat.name}
        </button>
      ))}
    </div>
  );
}
