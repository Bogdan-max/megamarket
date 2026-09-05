export const AVITO_CATEGORY_MAP: Record<string, { id: number; keywords: string }> = {
  auto: { id: 9, keywords: 'автомобили' },
  realestate: { id: 24, keywords: 'квартиры' },
  electronics: { id: 31, keywords: 'телефоны' },
  home: { id: 30, keywords: 'мебель' },
};

export const AVITO_CONDITIONS = ['used', 'new'];

export const AVITO_CATEGORY_FIELD_MAP: Record<
  string,
  { value: string; fields: Array<{ name: string; value: any }>; extra?: Record<string, any> }
> = {
  auto: {
    value: 'Автомобили',
    fields: [],
    extra: { itemParamsDisabled: false },
  },
  realestate: {
    value: 'Квартиры',
    fields: [],
  },
  electronics: {
    value: 'Телефоны',
    fields: [],
  },
  home: {
    value: 'Мебель и интерьер',
    fields: [],
  },
};

export function buildAvitoPayload(params: {
  ad: any;
  map: { id: number; keywords: string };
  contactName: string;
  contactPhone: string;
  condition: string;
  photoIds: string[];
}): Record<string, any> {
  const { ad, map, contactName, contactPhone, condition, photoIds } = params;

  const payload: Record<string, any> = {
    categoryId: map.id,
    adType: 'Classified',
    condition,
    contact: {
      name: contactName,
      phone: contactPhone.replace(/[^\d+]/g, ''),
    },
    address: {
      city: ad.city || 'Москва',
    },
    title: ad.title,
    description: ad.description || '',
    price: {
      value: Number(ad.price) || 0,
      currency: ad.currency || 'RUB',
    },
    images: photoIds.map((photoId) => ({ photo_id: photoId })),
  };

  if (ad.subcategory) payload.category = ad.subcategory;

  return payload;
}