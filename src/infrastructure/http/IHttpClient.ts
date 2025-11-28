export interface HttpRequestOptions<TQuery extends object = Record<string, unknown>> extends Omit<RequestInit, 'body'> {
  query?: TQuery;
}

export interface IHttpClient {
  get<T = any>(url: string, options?: Omit<HttpRequestOptions, 'method'>): Promise<T>;
  post<T = any, TBody = unknown>(url: string, body: TBody, options?: Omit<HttpRequestOptions, 'method'>): Promise<T>;
}

/**
 * HTTPリクエストエラーを表すカスタムエラークラス
 */
export class HttpError extends Error {
  /**
   * HttpErrorのインスタンスを作成します
   * @param status - HTTPステータスコード
   * @param message - エラーメッセージ
   * @param details - エラーの詳細情報（オプション）
   */
  constructor(public status: number, message: string, public details?: any) {
    super(message);
  }
}
