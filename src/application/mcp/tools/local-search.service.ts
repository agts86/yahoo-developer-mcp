import { Inject, Injectable, Logger } from '@nestjs/common';
import { MCP_REPOSITORY } from '../../../domain/mcp/imcp.repository.js';
import type { IMcpRepository } from '../../../domain/mcp/imcp.repository.js';
import { LocalSearchParams, LocalSearchResult } from '../../../domain/yahoo/yahoo.types.js';
import { McpToolDefinition, McpToolWithDefinition } from '../../../domain/mcp/tools/tool-definition.interface.js';
import { getAndAdvance } from '../paging/pagingStateManager.js';
import { LocalSearchQuery } from '../../../domain/mcp/queries/yahooQueries.js';

export interface LocalSearchToolInput extends LocalSearchParams {}
export interface LocalSearchToolOutput extends LocalSearchResult {}

/**
 * Yahoo!ローカルサーチツールサービス
 * ページング機能付きのローカル検索を提供します
 */
@Injectable()
export class LocalSearchService implements McpToolWithDefinition<LocalSearchToolInput, LocalSearchToolOutput> {
  readonly name = 'localSearch';
  private readonly logger = new Logger(LocalSearchService.name);

  /**
   * LocalSearchServiceのインスタンスを作成します
   * @param yahooService - Yahoo APIサービス
   */
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly yahooRepository: IMcpRepository
  ) {}

  /**
   * Yahoo!ローカルサーチAPIツールの実行関数
   * @param input ローカルサーチの入力パラメータ
   * @param yahooAppId Yahoo API Key
   * @returns ローカルサーチの結果
   */
  async execute(input: LocalSearchToolInput, yahooAppId: string): Promise<LocalSearchToolOutput> {
    this.logger.debug(`Local Search Tool Input: ${JSON.stringify(input)}`);

    if (!input.query && (input.lat === undefined || input.lng === undefined)) {
      throw new Error('localSearch requires either query or lat+lng');
    }

    const pageSize = input.results && input.results > 0 ? input.results : 10;
    let offset = input.offset ?? 0;
    let nextOffset: number | undefined;

    if (input.sessionId) {
      const hash = JSON.stringify({ q: input.query, lat: input.lat, lng: input.lng });
      const r = getAndAdvance({ sessionId: input.sessionId, hash }, pageSize, !!input.reset, input.offset);
      offset = r.offset;
      nextOffset = r.nextOffset;
    }

    const query: LocalSearchQuery = {
      appid: yahooAppId,
      output: 'json',
      query: input.query,
      lat: input.lat,
      lon: input.lng,
      start: offset + 1,
      results: pageSize
    };

    try {
      const result = await this.yahooRepository.localSearch(query);
      
      this.logger.debug(`Local Search Tool Output: Found ${result.items?.length || 0} items`);
      return { ...result, nextOffset };
      
    } catch (error) {
      this.logger.error(`Local Search Tool Error: ${error}`, error);
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
      description: 'Yahoo!ローカルサーチAPI - キーワードまたは座標でローカル検索（10件ページング対応）',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'キーワード検索文字列' },
          lat: { type: 'number', description: '緯度（座標検索の場合）' },
          lng: { type: 'number', description: '経度（座標検索の場合）' },
          sessionId: { type: 'string', description: 'ページング継続用セッションID' },
          offset: { type: 'number', description: '明示的オフセット指定' },
          reset: { type: 'boolean', description: 'ページングリセット' },
          results: { type: 'number', description: 'カスタムページサイズ（デフォルト10）' }
        }
      }
    };
  }
}
