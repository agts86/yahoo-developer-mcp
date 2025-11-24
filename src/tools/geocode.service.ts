import { Injectable, Logger } from '@nestjs/common';
import { YahooService } from '../yahoo/yahoo.service.js';
import { GeocodeParams, GeocodeResult } from '../types/yahoo.js';

export interface GeocodeToolInput extends GeocodeParams {}
export interface GeocodeToolOutput extends GeocodeResult {}

/**
 * Yahoo!ジオコーダツールサービス
 * 住所文字列から座標を取得します
 */
@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  constructor(private readonly yahooService: YahooService) {}

  /**
   * Yahoo!ジオコーダAPIツールの実行関数
   * @param input ジオコーディングの入力パラメータ
   * @param yahooAppId Yahoo API Key
   * @returns ジオコーディングの結果
   */
  async execute(input: GeocodeToolInput, yahooAppId: string): Promise<GeocodeToolOutput> {
    this.logger.debug(`Geocode Tool Input: ${JSON.stringify(input)}`);
    
    try {
      const result = await this.yahooService.geocode(input, yahooAppId);
      
      this.logger.debug(`Geocode Tool Output: Found ${result.items?.length || 0} items`);
      return result;
      
    } catch (error) {
      this.logger.error(`Geocode Tool Error: ${error}`, error);
      throw error;
    }
  }
}
