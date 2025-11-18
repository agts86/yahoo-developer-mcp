export interface HttpRequestOptions extends Omit<RequestInit, 'body'> {
  query?: Record<string, string | number | boolean | undefined>;
  bodyJson?: unknown;
}

export interface HttpClient {
  request<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
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
