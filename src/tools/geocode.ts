import { YahooClient } from '../client/yahooClient.js';
import { GeocodeParams, GeocodeResult } from '../types/yahoo.js';

export interface GeocodeToolInput extends GeocodeParams {}
export interface GeocodeToolOutput extends GeocodeResult {}

/**
 * Yahoo!ジオコーダAPIツールの実行関数
 * @param client - Yahoo APIクライアント
 * @param input - ジオコーディングの入力パラメータ
 * @returns ジオコーディングの結果
 */
export async function geocodeTool(client: YahooClient, input: GeocodeToolInput): Promise<GeocodeToolOutput> {
  return client.geocode(input);
}
