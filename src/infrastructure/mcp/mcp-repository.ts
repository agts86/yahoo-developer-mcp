import { Injectable, Logger } from '@nestjs/common';
import { HttpClient } from '../http/httpClient.js';
import {
  LocalSearchParams,
  LocalSearchResult,
  LocalSearchResponseRaw,
  GeocodeParams,
  GeocodeResult,
  GeocodeResponseRaw,
  ReverseGeocodeParams,
  ReverseGeocodeResult,
  ReverseGeocodeResponseRaw,
} from '../../domain/yahoo/yahoo.types.js';
import { IMcpRepository } from '../../domain/mcp/imcp.repository.js';
import { getAndAdvance } from '../../application/mcp/paging/pagingStateManager.js';

const BASE_LOCAL_SEARCH = 'https://map.yahooapis.jp/search/local/V1/localSearch';
const BASE_GEOCODE = 'https://map.yahooapis.jp/geocode/V1/geoCoder';
const BASE_REVERSE_GEOCODE = 'https://map.yahooapis.jp/geocode/V1/reverseGeoCoder';

function parseCoordinates(coord?: string): { lat?: number; lng?: number } {
  if (!coord) return {};
  const parts = coord.split(',');
  if (parts.length !== 2) return {};
  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  return { lat: isFinite(lat) ? lat : undefined, lng: isFinite(lng) ? lng : undefined };
}

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

function flattenReverse(raw: ReverseGeocodeResponseRaw): ReverseGeocodeResult {
  const features = raw.Feature || [];
  const items = features.map(f => ({
    name: f.Name,
    address: f.Property?.Address ?? f.Name
  }));
  return { items, raw };
}

/**
 * MCPリポジトリ実装（Yahoo API版） - 外部API呼び出しと整形を担当
 * ローカルサーチ、ジオコーダ、リバースジオコーダーAPIの統一アクセスを提供
 */
@Injectable()
export class McpRepository implements IMcpRepository {
  private readonly logger = new Logger(McpRepository.name);

  /**
   * YahooRepositoryのインスタンスを作成します
   * @param httpClient - HTTPクライアント
   * @param configService - アプリケーション設定サービス
   */
  constructor(
    private readonly httpClient: HttpClient
  ) {}

  async localSearch(params: LocalSearchParams, yahooAppId: string): Promise<LocalSearchResult> {
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
      appid: yahooAppId,
      output: 'json',
      query: params.query,
      lat: params.lat,
      lon: params.lng,
      start: offset + 1,
      results: pageSize
    };

    this.logger.debug(`Local Search Request params: ${JSON.stringify({ ...params, offset })}`);

    const raw = await this.httpClient.request<LocalSearchResponseRaw>(BASE_LOCAL_SEARCH, { query });
    const flat = flattenLocal(raw);
    return { ...flat, nextOffset };
  }

  async geocode(params: GeocodeParams, yahooAppId: string): Promise<GeocodeResult> {
    if (!params.query) throw new Error('geocode requires query');
    const query = {
      appid: yahooAppId,
      output: 'json',
      query: params.query
    };

    this.logger.debug(`Geocode Request params: ${JSON.stringify(params)}`);

    const raw = await this.httpClient.request<GeocodeResponseRaw>(BASE_GEOCODE, { query });
    return flattenGeocode(raw);
  }

  async reverseGeocode(params: ReverseGeocodeParams, yahooAppId: string): Promise<ReverseGeocodeResult> {
    if (params.lat === undefined || params.lng === undefined) {
      throw new Error('reverseGeocode requires lat & lng');
    }
    const query = {
      appid: yahooAppId,
      output: 'json',
      lat: params.lat,
      lon: params.lng
    };

    this.logger.debug(`Reverse Geocode Request params: ${JSON.stringify(params)}`);

    const raw = await this.httpClient.request<ReverseGeocodeResponseRaw>(BASE_REVERSE_GEOCODE, { query });
    return flattenReverse(raw);
  }

  private hashParams(p: LocalSearchParams): string {
    return JSON.stringify({ q: p.query, lat: p.lat, lng: p.lng });
  }
}
