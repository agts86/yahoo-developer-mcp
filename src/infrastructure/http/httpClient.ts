import axios from 'axios';
import { IHttpClient, HttpRequestOptions, HttpError } from './IHttpClient.js';

/**
 * ベースURLにクエリパラメータを付加して完全なURLを構築します
 * @param base - ベースURL
 * @param query - クエリパラメータのオブジェクト
 * @returns 完全なURL文字列
 */
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

/**
 * Fetch APIを使用したHTTPクライアントの実装
 */
/**
 * Axiosを用いたHTTPクライアント実装
 */
export class HttpClient implements IHttpClient {
  /**
   * GETリクエストを送信します
   * @param url - リクエストURL
   * @param options - リクエストオプション（methodは自動的にGETに設定）
   * @returns レスポンスデータ
   * @throws HTTPエラーが発生した場合にHttpErrorをスロー
   */
  async get<T = unknown>(url: string, options: Omit<HttpRequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * HTTPリクエストを送信し、レスポンスを取得します
   * @param url - リクエストURL
   * @param options - リクエストオプション
   * @returns レスポンスデータ
   * @throws HTTPエラーが発生した場合にHttpErrorをスロー
   */
  async request<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    const fullUrl = buildUrl(url, options.query);
    try {
      const res = await axios.request({
        url: fullUrl,
        method: options.method ?? 'GET',
        data: options.bodyJson,
        headers: options.bodyJson
          ? { 'Content-Type': 'application/json', ...(options.headers as any || {}) }
          : (options.headers as any),
        validateStatus: () => true,
      });
      if (res.status < 200 || res.status >= 300) {
        throw new HttpError(res.status, `HTTP ${res.status} for ${fullUrl}`, res.data);
      }
      return res.data as T;
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      const status = err?.response?.status ?? 0;
      const details = err?.response?.data;
      const reason = err?.message ?? String(err);
      throw new HttpError(status, `HTTP error for ${fullUrl}: ${reason}`, details);
    }
  }
}
