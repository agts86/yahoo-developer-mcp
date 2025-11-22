import { Injectable, Logger } from '@nestjs/common';
import { FetchHttpClient } from '../http/fetchClient.js';
import { AppConfigService } from '../config/config.js';
import {
  LocalSearchParams,
  LocalSearchResult,
  GeocodeParams,
  GeocodeResult,
  ReverseGeocodeParams,
  ReverseGeocodeResult,
} from '../types/yahoo.js';

/**
 * Yahoo APIサービス - 既存のYahooClientのNestJS版
 * ローカルサーチ、ジオコーダ、リバースジオコーダーAPIの統一アクセスを提供
 */
@Injectable()
export class YahooService {
  private readonly logger = new Logger(YahooService.name);
  private readonly baseUrl = 'https://map.yahooapis.jp';

  constructor(
    private readonly httpClient: FetchHttpClient,
    private readonly configService: AppConfigService,
  ) {}

  /**
   * Yahoo!ローカルサーチAPIで検索を実行します
   * @param params 検索パラメータ
   * @param yahooAppId 動的にYahoo API Keyを指定（ヘッダー認証用）
   * @returns 検索結果
   */
  async localSearch(params: LocalSearchParams, yahooAppId?: string): Promise<LocalSearchResult> {
    const appId = yahooAppId || this.configService.yahooAppId;
    const query = this.buildQuery({ ...params, appid: appId });
    const url = `${this.baseUrl}/search/local/V1/localSearch?${query}`;
    
    this.logger.debug(`Local Search Request: ${url}`);
    
    try {
      const response = await this.httpClient.get(url);
      return response as LocalSearchResult;
    } catch (error) {
      this.logger.error(`Local Search Error: ${error}`, error);
      throw new Error(`Yahoo Local Search API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Yahoo!ジオコーダAPIで住所から座標を取得します
   * @param params ジオコーディングパラメータ
   * @param yahooAppId 動的にYahoo API Keyを指定（ヘッダー認証用）
   * @returns ジオコーディング結果
   */
  async geocode(params: GeocodeParams, yahooAppId?: string): Promise<GeocodeResult> {
    const appId = yahooAppId || this.configService.yahooAppId;
    const query = this.buildQuery({ ...params, appid: appId });
    const url = `${this.baseUrl}/geocode/V1/geoCoder?${query}`;
    
    this.logger.debug(`Geocode Request: ${url}`);
    
    try {
      const response = await this.httpClient.get(url);
      return response as GeocodeResult;
    } catch (error) {
      this.logger.error(`Geocode Error: ${error}`, error);
      throw new Error(`Yahoo Geocode API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Yahoo!リバースジオコーダAPIで座標から住所を取得します
   * @param params リバースジオコーディングパラメータ
   * @param yahooAppId 動的にYahoo API Keyを指定（ヘッダー認証用）
   * @returns リバースジオコーディング結果
   */
  async reverseGeocode(params: ReverseGeocodeParams, yahooAppId?: string): Promise<ReverseGeocodeResult> {
    const appId = yahooAppId || this.configService.yahooAppId;
    const query = this.buildQuery({ ...params, appid: appId });
    const url = `${this.baseUrl}/geoapi/V1/reverseGeoCoder?${query}`;
    
    this.logger.debug(`Reverse Geocode Request: ${url}`);
    
    try {
      const response = await this.httpClient.get(url);
      return response as ReverseGeocodeResult;
    } catch (error) {
      this.logger.error(`Reverse Geocode Error: ${error}`, error);
      throw new Error(`Yahoo Reverse Geocode API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * クエリパラメータをURLエンコーディングした文字列に変換します
   * @param params クエリパラメータオブジェクト
   * @returns URLエンコードされたクエリ文字列
   */
  private buildQuery(params: Record<string, string | number | boolean | undefined>): string {
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    }
    
    return queryParams.toString();
  }
}
