import { HttpClient, HttpRequestOptions, HttpError } from './HttpClient.js';

function buildUrl(base: string, query?: Record<string, string | number | boolean | undefined>): string {
  if (!query || Object.keys(query).length === 0) return base;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    params.set(k, String(v));
  }
  const sep = base.includes('?') ? '&' : '?';
  return base + sep + params.toString();
}

export class FetchHttpClient implements HttpClient {
  async request<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    const fullUrl = buildUrl(url, options.query);
    const init: RequestInit = { ...options };
    if (options.bodyJson !== undefined) {
      init.body = JSON.stringify(options.bodyJson);
      init.headers = { ...(init.headers || {}), 'Content-Type': 'application/json' };
    }
    const res = await fetch(fullUrl, init);
    const text = await res.text();
    let data: any = text;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch (_) {
      // keep raw text
    }
    if (!res.ok) {
      throw new HttpError(res.status, `HTTP ${res.status} for ${fullUrl}`, data);
    }
    return data as T;
  }
}
