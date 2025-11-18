export interface HttpRequestOptions extends Omit<RequestInit, 'body'> {
  query?: Record<string, string | number | boolean | undefined>;
  bodyJson?: unknown;
}

export interface HttpClient {
  request<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
  }
}
