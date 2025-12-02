import type { LocalSearchParams, GeocodeParams, ReverseGeocodeParams } from '../../yahoo/yahoo.types.js';

export interface LocalSearchQuery {
  appid: string;
  output: 'json';
  query?: LocalSearchParams['query'];
  lat?: LocalSearchParams['lat'];
  lon?: LocalSearchParams['lng'];
  start?: number;
  results?: number;
}

export interface GeocodeQuery {
  appid: string;
  output: 'json';
  query: GeocodeParams['query'];
}

export interface ReverseGeocodeQuery {
  appid: string;
  output: 'json';
  lat: ReverseGeocodeParams['lat'];
  lon: ReverseGeocodeParams['lng'];
}
