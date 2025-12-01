import { Inject, Injectable, Logger } from '@nestjs/common';
import { MCP_REPOSITORY } from '../../../domain/mcp/imcp.repository.js';
import type { IMcpRepository } from '../../../domain/mcp/imcp.repository.js';
import { ReverseGeocodeParams, ReverseGeocodeResult } from '../../../domain/yahoo/yahoo.types.js';
import { McpToolDefinition, McpToolWithDefinition } from '../../../domain/mcp/tools/tool-definition.interface.js';
import { ReverseGeocodeQuery } from '../../../domain/mcp/queries/yahooQueries.js';

export interface ReverseGeocodeToolInput extends ReverseGeocodeParams {}
export interface ReverseGeocodeToolOutput extends ReverseGeocodeResult {}

/**
 * Yahoo!リバースジオコーダツールサービス
 * 座標から住所を取得します
 */
@Injectable()
export class ReverseGeocodeService implements McpToolWithDefinition<ReverseGeocodeToolInput, ReverseGeocodeToolOutput> {
  readonly name = 'reverseGeocode';
  private readonly logger = new Logger(ReverseGeocodeService.name);

  /**
   * ReverseGeocodeServiceのインスタンスを作成します
   * @param yahooService - Yahoo APIサービス
   */
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly yahooRepository: IMcpRepository
  ) {}

  /**
   * Yahoo!リバースジオコーダAPIツールの実行関数
   * @param input リバースジオコーディングの入力パラメータ
   * @param yahooAppId Yahoo API Key
   * @returns リバースジオコーディングの結果
   */
  async execute(input: ReverseGeocodeToolInput, yahooAppId: string): Promise<ReverseGeocodeToolOutput> {
    this.logger.debug(`Reverse Geocode Tool Input: ${JSON.stringify(input)}`);
    
    if (input.lat === undefined || input.lng === undefined) {
      throw new Error('reverseGeocode requires lat & lng');
    }

    const query: ReverseGeocodeQuery = {
      appid: yahooAppId,
      output: 'json',
      lat: input.lat,
      lon: input.lng
    };

    try {
      const result = await this.yahooRepository.reverseGeocode(query);
      
      this.logger.debug(`Reverse Geocode Tool Output: Found ${result.items?.length || 0} items`);
      return result;
      
    } catch (error) {
      this.logger.error(`Reverse Geocode Tool Error: ${error}`, error);
      throw error;
    }
  }

  /**
   * ツールの定義を取得します
   * @returns MCPツール定義
   */
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
