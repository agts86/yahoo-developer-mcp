import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AppConfigProvider } from '../../infrastructure/config/app-config.provider.js';

interface RequestWithYahooAppId {
  headers: Record<string, string | string[] | undefined>;
  yahooAppId?: string;
}

/**
 * Yahoo API Key認証ガード
 * HTTPリクエストのヘッダーからYahoo API Keyを検証し、アクセスを制御します
 */
@Injectable()
export class YahooApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(YahooApiKeyGuard.name);

  /**
   * YahooApiKeyGuardのインスタンスを作成します
   * @param configService - アプリケーション設定サービス
   */
  constructor(private readonly configService: AppConfigProvider) {}

  /**
   * リクエストがアクセス可能かどうかを判定します
   * @param context - 実行コンテキスト
   * @returns アクセス許可の可否
   * @throws UnauthorizedException - 認証が失敗した場合
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithYahooAppId>();
    const authHeader = request.headers.authorization;

    this.logger.debug(`Auth attempt - Authorization: ${authHeader ? '[PRESENT]' : '[MISSING]'}`);

    try {
      // ヘッダーからYahoo API Keyを抽出
      const yahooAppId = this.configService.extractYahooApiKey(typeof authHeader === 'string' ? authHeader : undefined);
      
      // API Keyが存在するかチェック
      if (!yahooAppId || yahooAppId.trim() === '') {
        this.logger.warn('Yahoo API Key not found in headers or environment');
        throw new UnauthorizedException('Yahoo API Key is required. Provide via Authorization header (Bearer token).');
      }

      // リクエストオブジェクトにAPI Keyを添付（後続処理で使用可能）
      request.yahooAppId = yahooAppId;
      
      this.logger.debug('Authentication successful');
      return true;

    } catch (error) {
      this.logger.error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Invalid authentication credentials');
    }
  }
}
