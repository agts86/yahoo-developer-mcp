import { IHttpClient, HttpRequestOptions } from '../../src/infrastructure/http/IHttpClient.js';

/**
 * テスト用のモックHTTPクライアント
 * カスタムハンドラーを使用してレスポンスをシミュレートします
 */
export class MockHttpClient implements IHttpClient {
  /**
   * MockHttpClientのインスタンスを作成します
   * @param handler - リクエストを処理するハンドラー関数
   */
  constructor(private handler: (url: string, options: HttpRequestOptions) => any | Promise<any>) {}
  
  /**
   * モックHTTPリクエストを実行します
   * @param url - リクエストURL
   * @param options - リクエストオプション
   * @returns モックレスポンス
   */
  async request<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return this.handler(url, options) as T;
  }

  /**
   * モックHTTP GETリクエストを実行します
   * @param url - リクエストURL
   * @param options - リクエストオプション
   * @returns モックレスポンス
   */
  async get<T = unknown>(url: string, options: Omit<HttpRequestOptions, 'method'> = {}): Promise<T> {
    return this.handler(url, { ...options, method: 'GET' }) as T;
  }
}

/**
 * 順次的にレスポンスを返すモックHTTPクライアントを作成します
 * @param responses - 順次的に返すレスポンスの配列
 * @returns モックHTTPクライアントのインスタンス
 */
export function createSequentialResponses(responses: any[]): MockHttpClient {
  let i = 0;
  return new MockHttpClient(() => {
    const r = responses[i] ?? responses[responses.length - 1];
    i++;
    return r;
  });
}
