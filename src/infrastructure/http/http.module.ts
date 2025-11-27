import { Module } from '@nestjs/common';
import { AxiosHttpClient } from './fetchClient.js';

@Module({
  providers: [AxiosHttpClient],
  exports: [AxiosHttpClient],
})
/**
 * HTTPモジュール
 * HTTPクライアントを提供します
 */
export class HttpModule {}
