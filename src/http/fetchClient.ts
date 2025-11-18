import { HttpClient, HttpRequestOptions, HttpError } from './HttpClient.js';

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
export class FetchHttpClient implements HttpClient {
  /**
   * HTTPリクエストを送信し、レスポンスを取得します
   * @param url - リクエストURL
   * @param options - リクエストオプション
   * @returns レスポンスデータ
   * @throws HTTPエラーが発生した場合にHttpErrorをスロー
   */
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
