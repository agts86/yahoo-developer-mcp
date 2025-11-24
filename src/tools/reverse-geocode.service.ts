import { Injectable, Logger } from '@nestjs/common';
import { YahooService } from '../yahoo/yahoo.service.js';
import { ReverseGeocodeParams, ReverseGeocodeResult } from '../types/yahoo.js';
import { McpTool } from './tool.interface.js';
import { McpToolDefinition, McpToolWithDefinition } from './tool-definition.interface.js';

export interface ReverseGeocodeToolInput extends ReverseGeocodeParams {}
export interface ReverseGeocodeToolOutput extends ReverseGeocodeResult {}

/**
 * Yahoo!リバースジオコーダツールサービス
 * 座標から住所を取得します
 */
@Injectable()
export class ReverseGeocodeService implements McpToolWithDefinition {
  readonly name = 'reverseGeocode';
  private readonly logger = new Logger(ReverseGeocodeService.name);

  constructor(private readonly yahooService: YahooService) {}

  /**
   * Yahoo!リバースジオコーダAPIツールの実行関数
   * @param input リバースジオコーディングの入力パラメータ
   * @param yahooAppId Yahoo API Key
   * @returns リバースジオコーディングの結果
   */
  async execute(input: ReverseGeocodeToolInput, yahooAppId: string): Promise<ReverseGeocodeToolOutput> {
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

  getDefinition(): McpToolDefinition {
    return {
      name: this.name,
      description: 'Yahoo!リバースジオコーダAPI - 座標から住所を取得',
      inputSchema: {
        type: 'object',
        properties: {
          lat: { type: 'number', description: '緯度' },
          lng: { type: 'number', description: '経度' }
        },
        required: ['lat', 'lng']
      }
    };
  }
}
