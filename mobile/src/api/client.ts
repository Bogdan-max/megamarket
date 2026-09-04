import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

async function request(path: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Ошибка запроса');
  return data;
}

export const api = {
  getAds: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/ads${q ? `?${q}` : ''}`);
  },
  getAd: (id: string) => request(`/ads/${id}`),
  createAd: (data: any, token: string) =>
    request('/ads', { method: 'POST', body: JSON.stringify(data) }, token),
  publishAll: (adId: string, token: string) =>
    request(`/platforms/${adId}/publish-all`, { method: 'POST' }, token),
  getPlatforms: () => request('/platforms'),
  register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};
