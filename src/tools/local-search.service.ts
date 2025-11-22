import { Injectable, Logger } from '@nestjs/common';
import { YahooService } from '../yahoo/yahoo.service.js';
import { LocalSearchParams, LocalSearchResult } from '../types/yahoo.js';

// PaginationStoreを一時的にインライン定義（後で適切に移植する）
class PaginationStore {
  private store = new Map<string, { offset: number; searchHash: string }>();

  buildRequestParams(input: any): any {
    // 簡易実装：後で適切な実装に置き換える
    return input;
  }

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
export class LocalSearchService {
  private readonly logger = new Logger(LocalSearchService.name);
  private readonly paginationStore = new PaginationStore();

  constructor(private readonly yahooService: YahooService) {}

  /**
   * Yahoo!ローカルサーチAPIツールの実行関数
   * @param input ローカルサーチの入力パラメータ
   * @param yahooAppId 動的にYahoo API Keyを指定（ヘッダー認証用）
   * @returns ローカルサーチの結果
   */
  async execute(input: LocalSearchToolInput, yahooAppId?: string): Promise<LocalSearchToolOutput> {
    this.logger.debug(`Local Search Tool Input: ${JSON.stringify(input)}`);

    // ページング管理
    const requestParams = this.paginationStore.buildRequestParams(input);
    
    try {
      const result = await this.yahooService.localSearch(requestParams, yahooAppId);
      
      // ページング状態を更新
      this.paginationStore.updatePaginationState(input, result);
      
      this.logger.debug(`Local Search Tool Output: Found ${result.items?.length || 0} items`);
      return result;
      
    } catch (error) {
      this.logger.error(`Local Search Tool Error: ${error}`, error);
      throw error;
    }
  }
}
