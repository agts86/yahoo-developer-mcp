import { YahooClient } from '../client/yahooClient.js';
import { ReverseGeocodeParams, ReverseGeocodeResult } from '../types/yahoo.js';

export interface ReverseGeocodeToolInput extends ReverseGeocodeParams {}
export interface ReverseGeocodeToolOutput extends ReverseGeocodeResult {}

/**
 * Yahoo!リバースジオコーダAPIツールの実行関数
 * @param client - Yahoo APIクライアント
 * @param input - リバースジオコーディングの入力パラメータ
 * @returns リバースジオコーディングの結果
 */
export async function reverseGeocodeTool(client: YahooClient, input: ReverseGeocodeToolInput): Promise<ReverseGeocodeToolOutput> {
  return client.reverseGeocode(input);
}
