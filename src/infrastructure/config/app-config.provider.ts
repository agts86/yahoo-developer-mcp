import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * アプリケーション設定プロバイダー
 * 設定値の解決とYahoo APIキー抽出を担当
 */
@Injectable()
export class AppConfigProvider {
  constructor(private readonly configService: ConfigService) {}

  /** アプリケーションがリッスンするポート番号（デフォルト: 3000） */
  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  /** CORSで許可されるオリジン一覧（デフォルト: http://localhost:3000） */
  get allowedOrigins(): string[] {
    const origins = this.configService.get<string>('ALLOWED_ORIGINS');
    return origins ? origins.split(',') : ['http://localhost:3000'];
  }

  /** AuthorizationヘッダーからYahoo API Keyを抽出 */
  extractYahooApiKey(authHeader?: string): string {
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    throw new Error('Authorization header with Bearer token is required');
  }
}
