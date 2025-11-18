// Minimal Yahoo Map API response/param typings (subset)
// References: https://developer.yahoo.co.jp/webapi/map/

export interface LocalSearchParams {
  query?: string; // Keyword search
  lat?: number; // Latitude for coordinate-based search
  lng?: number; // Longitude for coordinate-based search
  sessionId?: string; // For paging continuity
  offset?: number; // Explicit offset override (0-based)
  reset?: boolean; // Reset paging sequence
  results?: number; // Optional custom page size (default 10)
}

export interface LocalSearchItem {
  id?: string;
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  category?: string;
  tel?: string;
  url?: string;
}

export interface LocalSearchResponseRaw {
  // Actual API returns complex structure; we flatten minimally
  Feature?: Array<{
    Name?: string;
    Geometry?: { Coordinates?: string };
    Property?: { Address?: string; Tel1?: string; Genre?: { Name?: string } };
  }>;
}

export interface LocalSearchResult {
  items: LocalSearchItem[];
  nextOffset?: number; // undefined if no more
  raw: LocalSearchResponseRaw;
}

export interface GeocodeParams {
  query: string; // Address string
}

export interface GeocodeResponseRaw {
  Feature?: Array<{
    Name?: string;
    Geometry?: { Coordinates?: string };
    Property?: { Address?: string };
  }>;
}

export interface GeocodeResultItem {
  address?: string;
  lat?: number;
  lng?: number;
  name?: string;
}

export interface GeocodeResult {
  items: GeocodeResultItem[];
  raw: GeocodeResponseRaw;
}

export interface ReverseGeocodeParams {
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResponseRaw {
  Feature?: Array<{
    Name?: string;
    Property?: { Address?: string };
  }>;
}

export interface ReverseGeocodeResultItem {
  address?: string;
  name?: string;
}

export interface ReverseGeocodeResult {
  items: ReverseGeocodeResultItem[];
  raw: ReverseGeocodeResponseRaw;
}
