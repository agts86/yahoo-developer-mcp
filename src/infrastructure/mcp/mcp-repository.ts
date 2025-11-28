import { Injectable, Logger } from '@nestjs/common';
import { HttpClient } from '../http/httpClient.js';
import {
  LocalSearchResult,
  LocalSearchResponseRaw,
  GeocodeResult,
  GeocodeResponseRaw,
  ReverseGeocodeResult,
  ReverseGeocodeResponseRaw,
} from '../../domain/yahoo/yahoo.types.js';
import { IMcpRepository } from '../../domain/mcp/imcp.repository.js';
import { LocalSearchQuery, GeocodeQuery, ReverseGeocodeQuery } from '../../domain/mcp/queries/yahooQueries.js';

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

  async localSearch(query: LocalSearchQuery): Promise<LocalSearchResult> {
    this.logger.debug(`Local Search Request params: ${JSON.stringify(query)}`);
    const raw = await this.httpClient.get<LocalSearchResponseRaw, LocalSearchQuery>(BASE_LOCAL_SEARCH, { query });
    const flat = flattenLocal(raw);
    return { ...flat };
  }

  async geocode(query: GeocodeQuery): Promise<GeocodeResult> {
    this.logger.debug(`Geocode Request params: ${JSON.stringify(query)}`);
    const raw = await this.httpClient.get<GeocodeResponseRaw, GeocodeQuery>(BASE_GEOCODE, { query });
    return flattenGeocode(raw);
  }

  async reverseGeocode(query: ReverseGeocodeQuery): Promise<ReverseGeocodeResult> {
    this.logger.debug(`Reverse Geocode Request params: ${JSON.stringify(query)}`);
    const raw = await this.httpClient.get<ReverseGeocodeResponseRaw, ReverseGeocodeQuery>(BASE_REVERSE_GEOCODE, { query });
    return flattenReverse(raw);
  }

}
