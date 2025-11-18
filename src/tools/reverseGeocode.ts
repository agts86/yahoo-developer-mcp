import { YahooClient } from '../client/yahooClient.js';
import { ReverseGeocodeParams, ReverseGeocodeResult } from '../types/yahoo.js';

export interface ReverseGeocodeToolInput extends ReverseGeocodeParams {}
export interface ReverseGeocodeToolOutput extends ReverseGeocodeResult {}

export async function reverseGeocodeTool(client: YahooClient, input: ReverseGeocodeToolInput): Promise<ReverseGeocodeToolOutput> {
  return client.reverseGeocode(input);
}
