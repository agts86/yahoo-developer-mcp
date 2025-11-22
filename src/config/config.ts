import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * アプリケーション設定インターフェイス
 * アプリケーションの全体設定を定義します
 */
export interface AppConfig {
  yahooAppId: string;
  mcpMode: 'stdio' | 'http';
  port: number;
  allowedOrigins?: string[];
}

/**
 * アプリケーション設定サービス
 * 環境変数からアプリケーション設定を取得し、管理します
 */
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get yahooAppId(): string {
    const appId = this.configService.get<string>('YAHOO_APP_ID');
    if (!appId) {
      throw new Error('YAHOO_APP_ID environment variable is required');
    }
    return appId;
  }

  get mcpMode(): 'stdio' | 'http' {
    const mode = this.configService.get<string>('MCP_MODE', 'stdio');
    if (mode !== 'stdio' && mode !== 'http') {
      throw new Error('MCP_MODE must be either "stdio" or "http"');
    }
    return mode;
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get allowedOrigins(): string[] {
    const origins = this.configService.get<string>('ALLOWED_ORIGINS');
    return origins ? origins.split(',') : ['http://localhost:3000'];
  }

  /**
   * ヘッダーからYahoo API Keyを取得する（HTTP認証用）
   * @param authHeader Authorization ヘッダー
   * @returns Yahoo API Key
   */
  extractYahooApiKey(authHeader?: string): string {
    // Authorization Bearer tokenからの抽出
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // フォールバック: 環境変数
    return this.yahooAppId;
  }
}
