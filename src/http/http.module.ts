import { Module } from '@nestjs/common';
import { FetchHttpClient } from './fetchClient.js';

@Module({
  providers: [FetchHttpClient],
  exports: [FetchHttpClient],
})
/**
 * HTTPモジュール
 * HTTPクライアントを提供します
 */
export class HttpModule {}
