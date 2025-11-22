// Minimal Yahoo Map API response/param typings (subset)
// References: https://developer.yahoo.co.jp/webapi/map/

/**
 * ローカルサーチAPIのリクエストパラメータ
 */
export interface LocalSearchParams {
  query?: string; // Keyword search
  lat?: number; // Latitude for coordinate-based search
  lng?: number; // Longitude for coordinate-based search
  sessionId?: string; // For paging continuity
  offset?: number; // Explicit offset override (0-based)
  reset?: boolean; // Reset paging sequence
  results?: number; // Optional custom page size (default 10)
}

/**
 * ローカルサーチAPIの検索結果アイテム
 */
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

/**
 * Yahoo! ローカルサーチAPIから返される生レスポンス形式
 */
export interface LocalSearchResponseRaw {
  // Actual API returns complex structure; we flatten minimally
  Feature?: Array<{
    Name?: string;
    Geometry?: { Coordinates?: string };
    Property?: { Address?: string; Tel1?: string; Genre?: { Name?: string } };
  }>;
}

/**
 * ローカルサーチAPIの整形済みレスポンス
 */
export interface LocalSearchResult {
  items: LocalSearchItem[];
  nextOffset?: number; // undefined if no more
  raw: LocalSearchResponseRaw;
}

/**
 * ジオコーダAPIのリクエストパラメータ
 */
export interface GeocodeParams {
  query: string; // Address string
}

/**
 * Yahoo! ジオコーダAPIから返される生レスポンス形式
 */
export interface GeocodeResponseRaw {
  Feature?: Array<{
    Name?: string;
    Geometry?: { Coordinates?: string };
    Property?: { Address?: string };
  }>;
}

/**
 * ジオコーダAPIの検索結果アイテム
 */
export interface GeocodeResultItem {
  address: string;
  lat?: number;
  lng?: number;
  name?: string;
}

/**
 * ジオコーダAPIの整形済みレスポンス
 */
export interface GeocodeResult {
  items: GeocodeResultItem[];
  raw: GeocodeResponseRaw;
}

/**
 * リバースジオコーダAPIのリクエストパラメータ
 */
export interface ReverseGeocodeParams {
  lat: number;
  lng: number;
}

/**
 * Yahoo! リバースジオコーダAPIから返される生レスポンス形式
 */
export interface ReverseGeocodeResponseRaw {
  Feature?: Array<{
    Name?: string;
    Property?: { Address?: string };
  }>;
}

/**
 * リバースジオコーダAPIの検索結果アイテム
 */
export interface ReverseGeocodeResultItem {
  address?: string;
  name?: string;
}

/**
 * リバースジオコーダAPIの整形済みレスポンス
 */
export interface ReverseGeocodeResult {
  items: ReverseGeocodeResultItem[];
  raw: ReverseGeocodeResponseRaw;
}
