import { HttpClient } from '../http/HttpClient.js';
import { config } from '../config/env.js';
import {
  LocalSearchParams,
  LocalSearchResult,
  LocalSearchResponseRaw,
  GeocodeParams,
  GeocodeResult,
  GeocodeResponseRaw,
  ReverseGeocodeParams,
  ReverseGeocodeResult,
  ReverseGeocodeResponseRaw
} from '../types/yahoo.js';
import { getAndAdvance } from '../server/paginationStore.js';

const BASE_LOCAL_SEARCH = 'https://map.yahooapis.jp/search/local/V1/localSearch';
const BASE_GEOCODE = 'https://map.yahooapis.jp/geocode/V1/geoCoder';
const BASE_REVERSE_GEOCODE = 'https://map.yahooapis.jp/geocode/V1/reverseGeoCoder';

/**
 * Yahoo APIの座標文字列を緯度経度オブジェクトにパースします
 * @param coord - Yahoo APIから返される座標文字列（"lng,lat"形式）
 * @returns 緯度経度を含むオブジェクト
 */
function parseCoordinates(coord?: string): { lat?: number; lng?: number } {
  // Yahoo returns "lng,lat" or "lon,lat"
  if (!coord) return {};
  const parts = coord.split(',');
  if (parts.length !== 2) return {};
  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  return { lat: isFinite(lat) ? lat : undefined, lng: isFinite(lng) ? lng : undefined };
}

/**
 * Yahoo ローカルサーチAPIのレスポンスを平坦化して使いやすい形式に変換します
 * @param raw - Yahoo APIからの生レスポンス
 * @returns 変換されたローカルサーチ結果
 */
function flattenLocal(raw: LocalSearchResponseRaw): LocalSearchResult {
  const features = raw.Feature || [];
  const items = features.map(f => {
    const coord = parseCoordinates(f.Geometry?.Coordinates);
    return {
      id: f.Name,
      name: f.Name,
      address: f.Property?.Address,
      lat: coord.lat,
      lng: coord.lng,
      category: f.Property?.Genre?.Name,
      tel: f.Property?.Tel1
    };
  });
  return { items, raw };
}

/**
 * Yahoo ジオコーダAPIのレスポンスを平坦化して使いやすい形式に変換します
 * @param raw - Yahoo APIからの生レスポンス
 * @returns 変換されたジオコード結果
 */
function flattenGeocode(raw: GeocodeResponseRaw): GeocodeResult {
  const features = raw.Feature || [];
  const items = features.map(f => {
    const coord = parseCoordinates(f.Geometry?.Coordinates);
    return {
      name: f.Name,
      address: f.Property?.Address ?? f.Name ?? '',
      lat: coord.lat,
      lng: coord.lng
    };
  });
  return { items, raw };
}

/**
 * Yahoo リバースジオコーダAPIのレスポンスを平坦化して使いやすい形式に変換します
 * @param raw - Yahoo APIからの生レスポンス
 * @returns 変換されたリバースジオコード結果
 */
function flattenReverse(raw: ReverseGeocodeResponseRaw): ReverseGeocodeResult {
  const features = raw.Feature || [];
  const items = features.map(f => ({
    name: f.Name,
    address: f.Property?.Address ?? f.Name
  }));
  return { items, raw };
}

/**
 * Yahoo!デベロッパーネットワークAPIのクライアントクラス
 * ローカルサーチ、ジオコーダ、リバースジオコーダの機能を提供します
 */
export class YahooClient {
  /**
   * YahooClientのインスタンスを作成します
   * @param http - HTTPクライアントのインスタンス
   */
  constructor(private http: HttpClient) {}

  /**
   * Yahoo!ローカルサーチAPIを使用してローカル検索を実行します
   * @param params - 検索パラメータ（キーワードまたは座標）
   * @returns ローカル検索の結果
   * @throws キーワードまたは座標のいずれも指定されていない場合にエラーをスロー
   */
  async localSearch(params: LocalSearchParams): Promise<LocalSearchResult> {
    if (!params.query && (params.lat === undefined || params.lng === undefined)) {
      throw new Error('localSearch requires either query or lat+lng');
    }
    const pageSize = params.results && params.results > 0 ? params.results : 10;
    let offset = params.offset ?? 0;
    let nextOffset: number | undefined;

    if (params.sessionId) {
      const hash = this.hashParams(params);
      const r = getAndAdvance({ sessionId: params.sessionId, hash }, pageSize, !!params.reset, params.offset);
      offset = r.offset;
      nextOffset = r.nextOffset;
    }

    const query: Record<string, string | number | boolean | undefined> = {
      appid: config.yahooAppId,
      output: 'json',
      query: params.query,
      lat: params.lat,
      lon: params.lng,
      start: offset + 1, // API may be 1-based; adjust as needed
      results: pageSize
    };

    const raw = await this.http.request<LocalSearchResponseRaw>(BASE_LOCAL_SEARCH, { query });
    const flat = flattenLocal(raw);
    return { ...flat, nextOffset };
  }

  /**
   * Yahoo!ジオコーダAPIを使用して住所を緯度経度に変換します
   * @param params - ジオコーディングパラメータ（住所文字列）
   * @returns ジオコーディングの結果
   * @throws クエリが指定されていない場合にエラーをスロー
   */
  async geocode(params: GeocodeParams): Promise<GeocodeResult> {
    if (!params.query) throw new Error('geocode requires query');
    const query = {
      appid: config.yahooAppId,
      output: 'json',
      query: params.query
    };
    const raw = await this.http.request<GeocodeResponseRaw>(BASE_GEOCODE, { query });
    return flattenGeocode(raw);
  }

  /**
   * Yahoo!リバースジオコーダAPIを使用して緯度経度を住所に変換します
   * @param params - リバースジオコーディングパラメータ（緯度・経度）
   * @returns リバースジオコーディングの結果
   * @throws 緯度または経度が指定されていない場合にエラーをスロー
   */
  async reverseGeocode(params: ReverseGeocodeParams): Promise<ReverseGeocodeResult> {
    if (params.lat === undefined || params.lng === undefined) {
      throw new Error('reverseGeocode requires lat & lng');
    }
    const query = {
      appid: config.yahooAppId,
      output: 'json',
      lat: params.lat,
      lon: params.lng
    };
    const raw = await this.http.request<ReverseGeocodeResponseRaw>(BASE_REVERSE_GEOCODE, { query });
    return flattenReverse(raw);
  }

  /**
   * ローカルサーチパラメータのハッシュ値を生成します（ページング管理用）
   * @param p - ローカルサーチパラメータ
   * @returns パラメータのハッシュ文字列
   */
  private hashParams(p: LocalSearchParams): string {
    return JSON.stringify({ q: p.query, lat: p.lat, lng: p.lng });
  }
}
