import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/config.js';

/**
 * Yahoo API Key認証ガード
 * HTTPリクエストのヘッダーからYahoo API Keyを検証し、アクセスを制御します
 */
@Injectable()
export class YahooApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(YahooApiKeyGuard.name);

  constructor(private readonly configService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    this.logger.debug(`Auth attempt - Authorization: ${authHeader ? '[PRESENT]' : '[MISSING]'}`);

    try {
      // ヘッダーからYahoo API Keyを抽出
      const yahooAppId = this.configService.extractYahooApiKey(authHeader);
      
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