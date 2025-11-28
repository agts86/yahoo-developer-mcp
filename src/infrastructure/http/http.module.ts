import { Module } from '@nestjs/common';
import { HttpClient } from './httpClient.js';

@Module({
  providers: [HttpClient],
  exports: [HttpClient],
})
/**
 * HTTPモジュール
 * HTTPクライアントを提供します
 */
export class HttpModule {}
