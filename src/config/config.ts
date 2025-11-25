import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * アプリケーション設定インターフェイス
 * アプリケーションの全体設定を定義します
 */
export interface AppConfig {
  port: number;
  allowedOrigins?: string[];
  extractYahooApiKey(authHeader?: string): string;
}

/**
 * アプリケーション設定サービス
 * HTTPモード専用のアプリケーション設定を管理します
 */
@Injectable()
export class AppConfigService {
  /**
   * AppConfigServiceのインスタンスを作成します
   * @param configService - NestJSの設定サービス
   */
  constructor(private configService: ConfigService) {}

  /**
   * アプリケーションがリッスンするポート番号を取得します
   * @returns ポート番号（デフォルト: 3000）
   */
  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  /**
   * CORSで許可されるオリジンの一覧を取得します
   * @returns 許可されたオリジンの配列
   */
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
    
    throw new Error('Authorization header with Bearer token is required');
  }
}
