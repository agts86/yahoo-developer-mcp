import { Inject, Injectable, Logger } from '@nestjs/common';
import { MCP_REPOSITORY } from '../../domain/mcp/mcp.repository.js';
import type { McpRepository } from '../../domain/mcp/mcp.repository.js';
import { LocalSearchParams, LocalSearchResult } from '../../domain/yahoo/yahoo.types.js';
import { McpToolDefinition, McpToolWithDefinition } from '../../domain/tools/tool-definition.interface.js';

/**
 * ページング管理クラス（一時的なインライン実装）
 * 後で適切な実装に置き換える予定
 */
class PaginationStore {
  private store = new Map<string, { offset: number; searchHash: string }>();

  /**
   * リクエストパラメータを構築します
   * @param input - 入力パラメータ
   * @returns 構築されたリクエストパラメータ
   */
  buildRequestParams(input: any): any {
    // 簡易実装：後で適切な実装に置き換える
    return input;
  }

  /**
   * ページング状態を更新します
   * @param input - 入力パラメータ
   * @param result - 実行結果
   */
  updatePaginationState(input: any, result: any): void {
    // 簡易実装：後で適切な実装に置き換える
  }
}

export interface LocalSearchToolInput extends LocalSearchParams {}
export interface LocalSearchToolOutput extends LocalSearchResult {}

/**
 * Yahoo!ローカルサーチツールサービス
 * ページング機能付きのローカル検索を提供します
 */
@Injectable()
export class LocalSearchService implements McpToolWithDefinition {
  readonly name = 'localSearch';
  private readonly logger = new Logger(LocalSearchService.name);
  private readonly paginationStore = new PaginationStore();

  /**
   * LocalSearchServiceのインスタンスを作成します
   * @param yahooService - Yahoo APIサービス
   */
  constructor(
    @Inject(MCP_REPOSITORY)
    private readonly yahooRepository: McpRepository
  ) {}

  /**
   * Yahoo!ローカルサーチAPIツールの実行関数
   * @param input ローカルサーチの入力パラメータ
   * @param yahooAppId Yahoo API Key
   * @returns ローカルサーチの結果
   */
  async execute(input: LocalSearchToolInput, yahooAppId: string): Promise<LocalSearchToolOutput> {
    this.logger.debug(`Local Search Tool Input: ${JSON.stringify(input)}`);

    // ページング管理
    const requestParams = this.paginationStore.buildRequestParams(input);
    
    try {
      const result = await this.yahooRepository.localSearch(requestParams, yahooAppId);
      
      // ページング状態を更新
      this.paginationStore.updatePaginationState(input, result);
      
      this.logger.debug(`Local Search Tool Output: Found ${result.items?.length || 0} items`);
      return result;
      
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
