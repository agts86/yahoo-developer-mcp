import { YahooClient } from '../client/yahooClient.js';
import { GeocodeParams, GeocodeResult } from '../types/yahoo.js';

export interface GeocodeToolInput extends GeocodeParams {}
export interface GeocodeToolOutput extends GeocodeResult {}

export async function geocodeTool(client: YahooClient, input: GeocodeToolInput): Promise<GeocodeToolOutput> {
  return client.geocode(input);
}
