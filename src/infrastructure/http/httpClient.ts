import type { IHttpClient, HttpRequestOptions } from './IHttpClient.js';
import { HttpError } from './IHttpClient.js';

function buildUrl<TQuery extends object>(base: string, query?: TQuery): string {
  if (!query || Object.keys(query).length === 0) return base;

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query as Record<string, unknown>)) {
    if (v != null) {
      params.set(k, convertToString(v));
    }
  }

  const sep = base.includes('?') ? '&' : '?';
  return base + sep + params.toString();
}

function convertToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return JSON.stringify(value);
}

export class HttpClient implements IHttpClient {
  private async send<T>(config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
  }): Promise<T> {
    let res: Response;
    try {
      res = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpError(0, `Network error for ${config.url}: ${message}`);
    }

    if (res.status < 200 || res.status >= 300) {
      const details: unknown = await (res.json() as Promise<unknown>).catch(() => undefined);
      throw new HttpError(
        res.status,
        `HTTP ${res.status} for ${config.url}`,
        details,
      );
    }

    return res.json() as Promise<T>;
  }

  async get<T = unknown, TQuery extends object = Record<string, unknown>>(
    url: string,
    options: Omit<HttpRequestOptions<TQuery>, 'method'> = {},
  ): Promise<T> {
    const fullUrl = buildUrl<TQuery>(url, options.query);
    return this.send<T>({
      url: fullUrl,
      method: 'GET',
      headers: options.headers as Record<string, string>,
    });
  }

  async post<
    T = unknown,
    TBody = unknown,
    TQuery extends object = Record<string, unknown>,
  >(
    url: string,
    body: TBody,
    options: Omit<HttpRequestOptions<TQuery>, 'method'> = {},
  ): Promise<T> {
    const fullUrl = buildUrl<TQuery>(url, options.query);
    return this.send<T>({
      url: fullUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      },
      body: JSON.stringify(body),
    });
  }
}
