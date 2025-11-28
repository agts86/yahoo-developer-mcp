import { LocalSearchResult, GeocodeResult, ReverseGeocodeResult } from '../yahoo/yahoo.types.js';
import { LocalSearchQuery, GeocodeQuery, ReverseGeocodeQuery } from './queries/yahooQueries.js';

/**
 * MCPユースケースで利用する外部データ取得のリポジトリ抽象
 * Yahoo APIなどの実装詳細は隠蔽し、MCP側はこのインターフェース経由で取得する
 */
export interface IMcpRepository {
  localSearch(query: LocalSearchQuery): Promise<LocalSearchResult>;
  geocode(query: GeocodeQuery): Promise<GeocodeResult>;
  reverseGeocode(query: ReverseGeocodeQuery): Promise<ReverseGeocodeResult>;
}

/**
 * MCPリポジトリ用のDIトークン
 * Nestではインターフェースが型情報として残らないため、シンボルを使用する
 */
export const MCP_REPOSITORY = Symbol('MCP_REPOSITORY');
