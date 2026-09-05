import * as crypto from 'crypto';

export interface AvitoToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AvitoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const AVITO_API = 'https://api.avito.ru';

export class AvitoError extends Error {
  constructor(message: string, public status?: number, public body?: any) {
    super(message);
  }
}

export class AvitoAdapter {
  constructor(private config: AvitoConfig) {}

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state,
    });
    return `${AVITO_API}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<AvitoToken> {
    const res = await fetch(`${AVITO_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    return this.parseTokenResponse(res, 'authorization_code');
  }

  async refreshToken(refreshToken: string): Promise<AvitoToken> {
    const res = await fetch(`${AVITO_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    return this.parseTokenResponse(res, 'refresh_token');
  }

  private async parseTokenResponse(res: Response, flow: string): Promise<AvitoToken> {
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { /* keep empty */ }
    if (!res.ok) {
      throw new AvitoError(
        `Авито вернул ошибку (${flow}): ${data.error_description || data.error || text}`,
        res.status,
        data,
      );
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + Number(data.expires_in || 3600) * 1000),
    };
  }

  async getUserInfo(accessToken: string) {
    const res = await fetch(`${AVITO_API}/core/v1/accounts/self`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) {
      throw new AvitoError(`Авито: не удалось получить аккаунт (${res.status})`, res.status, data);
    }
    return data;
  }

  async searchCategories(accessToken: string, name: string) {
    const res = await fetch(
      `${AVITO_API}/core/v1/categories?name=${encodeURIComponent(name)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) {
      throw new AvitoError(`Авито: не удалось получить категорию (${res.status})`, res.status, data);
    }
    return data;
  }

  async getRequireFields(accessToken: string, categoryId: number) {
    const res = await fetch(
      `${AVITO_API}/core/v1/categories/category/${categoryId}/require-fields`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const text = await res.text();
    if (!res.ok) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  async uploadPhoto(accessToken: string, imageUrl: string): Promise<string> {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) {
      throw new AvitoError(`Не удалось скачать фото для Авито: ${imageUrl} (${imgRes.status})`);
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());

    const form = new FormData();
    form.append('photo', new Blob([buf]), 'photo.jpg');

    const res = await fetch(`${AVITO_API}/core/v1/upload/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) {
      throw new AvitoError(`Авито: ошибка загрузки фото (${res.status})`, res.status, data);
    }
    return data.photo_id || data.photoId || data.photo_name;
  }

  async createItem(
    accessToken: string,
    payload: Record<string, any>,
  ): Promise<{ id: string; title: string; url: string }> {
    const res = await fetch(`${AVITO_API}/core/v1/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      const messages = Array.isArray(data?.errors)
        ? data.errors.map((e: any) => e.messages?.join(', ') || e.message || JSON.stringify(e)).join('; ')
        : data?.error || text;
      throw new AvitoError(`Авито: публикация отклонена (${res.status}) ${messages}`, res.status, data);
    }

    return {
      id: String(data.id || data.item_id || ''),
      title: data.title || (payload.title as string) || '',
      url: data.url || (data.id ? `https://www.avito.ru/${data.id}` : ''),
    };
  }
}