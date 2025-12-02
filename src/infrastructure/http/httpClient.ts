import axios from 'axios';
import { IHttpClient, HttpRequestOptions, HttpError } from './IHttpClient.js';

/**
 * ベースURLにクエリパラメータを付加して完全なURLを構築します
 * @param base - ベースURL
 * @param query - クエリパラメータのオブジェクト
 * @returns 完全なURL文字列
 */
function buildUrl<TQuery extends object>(base: string, query?: TQuery): string {
  if (!query || Object.keys(query).length === 0) return base;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query as Record<string, unknown>)) {
    if (v === undefined) continue;
    params.set(k, String(v));
  }
  const sep = base.includes('?') ? '&' : '?';
  return base + sep + params.toString();
}

/**
 * Axiosを用いたHTTPクライアント実装
 */
export class HttpClient implements IHttpClient {
  /**
   * 実際のHTTP送信を行う共通処理
   */
  private async send<T>(
    config: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      data?: unknown;
    }
  ): Promise<T> {
    try {
      const res = await axios.request({
        ...config,
        validateStatus: () => true,
      });
      if (res.status < 200 || res.status >= 300) {
        throw new HttpError(res.status, `HTTP ${res.status} for ${config.url}`, res.data);
      }
      return res.data as T;
    } catch (err: unknown) {
      if (err instanceof HttpError) throw err;
      
      // err が axios エラーオブジェクトかどうかチェック
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosErr = isAxiosError ? err as { response?: { status?: number; data?: unknown }; message?: string } : null;
      
      const status = axiosErr?.response?.status ?? 0;
      const details = axiosErr?.response?.data;
      const reason = axiosErr?.message ?? String(err);
      throw new HttpError(status, `HTTP error for ${config.url}: ${reason}`, details);
    }
  }

  /**
   * GETリクエストを送信します
   */
  async get<T = unknown, TQuery extends object = Record<string, unknown>>(url: string, options: Omit<HttpRequestOptions<TQuery>, 'method'> = {}): Promise<T> {
    const fullUrl = buildUrl<TQuery>(url, options.query);
    return this.send<T>({
      url: fullUrl,
      method: 'GET',
      headers: options.headers as Record<string, string>,
    });
  }

  /**
   * POSTリクエストを送信します
   */
  async post<T = unknown, TBody = unknown, TQuery extends object = Record<string, unknown>>(url: string, body: TBody, options: Omit<HttpRequestOptions<TQuery>, 'method'> = {}): Promise<T> {
    const fullUrl = buildUrl<TQuery>(url, options.query);
    return this.send<T>({
      url: fullUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) },
      data: body
    });
  }
}
