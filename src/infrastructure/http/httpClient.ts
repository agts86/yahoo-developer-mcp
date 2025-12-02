import axios from 'axios';
import type { IHttpClient, HttpRequestOptions} from './IHttpClient.js';
import { HttpError } from './IHttpClient.js';

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
    if (v != null) { // nullish coalescing: null と undefined を同時にチェック
      params.set(k, convertToString(v));
    }
  }
  
  const sep = base.includes('?') ? '&' : '?';
  return base + sep + params.toString();
}

/**
 * 値を文字列に安全に変換します
 * nullとundefinedは除外済みなので、実際の値のみを変換
 */
function convertToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
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
      
      this.validateResponse(res, config.url);
      return res.data as T;
    } catch (err: unknown) {
      const error = this.handleRequestError(err, config.url);
      throw error;
    }
  }

  /**
   * レスポンスのステータスコードを検証
   */
  private validateResponse(res: { status: number; data: unknown }, url: string): void {
    if (res.status < 200 || res.status >= 300) {
      throw new HttpError(res.status, `HTTP ${res.status} for ${url}`, res.data);
    }
  }

  /**
   * リクエストエラーを処理
   */
  private handleRequestError(err: unknown, url: string): HttpError {
    if (err instanceof HttpError) return err;
    
    const axiosError = this.parseAxiosError(err);
    const httpError = this.createHttpErrorFromAxios(axiosError, url);
    return httpError;
  }

  /**
   * Axiosエラーをパースして必要な情報を取得
   */
  private parseAxiosError(err: unknown): { status: number; details: unknown; reason: string } {
    const axiosErr = this.extractAxiosErrorData(err);
    
    return {
      status: axiosErr?.response?.status ?? 0,
      details: axiosErr?.response?.data,
      reason: axiosErr?.message ?? String(err)
    };
  }

  /**
   * Axiosエラーのデータを抽出
   */
  private extractAxiosErrorData(err: unknown): { response?: { status?: number; data?: unknown }; message?: string } | null {
    const isAxiosError = err && typeof err === 'object' && 'response' in err;
    return isAxiosError ? err as { response?: { status?: number; data?: unknown }; message?: string } : null;
  }

  /**
   * AxiosエラーからHttpErrorを生成
   */
  private createHttpErrorFromAxios(error: { status: number; details: unknown; reason: string }, url: string): HttpError {
    return new HttpError(error.status, `HTTP error for ${url}: ${error.reason}`, error.details);
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
