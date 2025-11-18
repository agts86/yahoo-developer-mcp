import { YahooClient } from '../client/yahooClient.js';
import { LocalSearchParams, LocalSearchResult } from '../types/yahoo.js';

export interface LocalSearchToolInput extends LocalSearchParams {}
export interface LocalSearchToolOutput extends LocalSearchResult {}

export async function localSearchTool(client: YahooClient, input: LocalSearchToolInput): Promise<LocalSearchToolOutput> {
  return client.localSearch(input);
}
