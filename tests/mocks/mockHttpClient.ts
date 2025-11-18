import { HttpClient, HttpRequestOptions } from '../../src/http/HttpClient.js';

export class MockHttpClient implements HttpClient {
  constructor(private handler: (url: string, options: HttpRequestOptions) => any | Promise<any>) {}
  async request<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    return this.handler(url, options) as T;
  }
}

export function createSequentialResponses(responses: any[]): MockHttpClient {
  let i = 0;
  return new MockHttpClient(() => {
    const r = responses[i] ?? responses[responses.length - 1];
    i++;
    return r;
  });
}
