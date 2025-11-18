import { YahooClient } from '../client/yahooClient.js';
import { LocalSearchParams, LocalSearchResult } from '../types/yahoo.js';

export interface LocalSearchToolInput extends LocalSearchParams {}
export interface LocalSearchToolOutput extends LocalSearchResult {}

/**
 * Yahoo!ローカルサーチAPIツールの実行関数
 * @param client - Yahoo APIクライアント
 * @param input - ローカルサーチの入力パラメータ
 * @returns ローカルサーチの結果
 */
export async function localSearchTool(client: YahooClient, input: LocalSearchToolInput): Promise<LocalSearchToolOutput> {
  return client.localSearch(input);
}
