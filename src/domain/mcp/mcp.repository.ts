import { LocalSearchParams, LocalSearchResult, GeocodeParams, GeocodeResult, ReverseGeocodeParams, ReverseGeocodeResult } from '../yahoo/yahoo.types.js';

/**
 * MCPユースケースで利用する外部データ取得のリポジトリ抽象
 * Yahoo APIなどの実装詳細は隠蔽し、MCP側はこのインターフェース経由で取得する
 */
export interface McpRepository {
  localSearch(params: LocalSearchParams, yahooAppId: string): Promise<LocalSearchResult>;
  geocode(params: GeocodeParams, yahooAppId: string): Promise<GeocodeResult>;
  reverseGeocode(params: ReverseGeocodeParams, yahooAppId: string): Promise<ReverseGeocodeResult>;
}

/**
 * MCPリポジトリ用のDIトークン
 * Nestではインターフェースが型情報として残らないため、シンボルを使用する
 */
export const MCP_REPOSITORY = Symbol('MCP_REPOSITORY');
