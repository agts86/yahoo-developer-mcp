import { Module } from '@nestjs/common';
import { YahooService } from './yahoo.service.js';
import { HttpModule } from '../http/http.module.js';
import { AppConfigService } from '../config/config.js';

@Module({
  imports: [HttpModule],
  providers: [YahooService, AppConfigService],
  exports: [YahooService],
})
/**
 * Yahoo APIモジュール
 * Yahoo Developer Network APIへのアクセスを提供します
 */
export class YahooModule {}
