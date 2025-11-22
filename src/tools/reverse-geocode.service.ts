import { Injectable, Logger } from '@nestjs/common';
import { YahooService } from '../yahoo/yahoo.service.js';
import { ReverseGeocodeParams, ReverseGeocodeResult } from '../types/yahoo.js';

export interface ReverseGeocodeToolInput extends ReverseGeocodeParams {}
export interface ReverseGeocodeToolOutput extends ReverseGeocodeResult {}

/**
 * Yahoo!リバースジオコーダツールサービス
 * 座標から住所を取得します
 */
@Injectable()
export class ReverseGeocodeService {
  private readonly logger = new Logger(ReverseGeocodeService.name);

  constructor(private readonly yahooService: YahooService) {}

  /**
   * Yahoo!リバースジオコーダAPIツールの実行関数
   * @param input リバースジオコーディングの入力パラメータ
   * @param yahooAppId 動的にYahoo API Keyを指定（ヘッダー認証用）
   * @returns リバースジオコーディングの結果
   */
  async execute(input: ReverseGeocodeToolInput, yahooAppId?: string): Promise<ReverseGeocodeToolOutput> {
    this.logger.debug(`Reverse Geocode Tool Input: ${JSON.stringify(input)}`);
    
    try {
      const result = await this.yahooService.reverseGeocode(input, yahooAppId);
      
      this.logger.debug(`Reverse Geocode Tool Output: Found ${result.items?.length || 0} items`);
      return result;
      
    } catch (error) {
      this.logger.error(`Reverse Geocode Tool Error: ${error}`, error);
      throw error;
    }
  }
}
