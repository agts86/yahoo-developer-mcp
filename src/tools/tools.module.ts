import { Module } from '@nestjs/common';
import { YahooModule } from '../yahoo/yahoo.module.js';
import { LocalSearchService } from './local-search.service.js';
import { GeocodeService } from './geocode.service.js';
import { ReverseGeocodeService } from './reverse-geocode.service.js';

@Module({
  imports: [YahooModule],
  providers: [
    LocalSearchService,
    GeocodeService,
    ReverseGeocodeService,
  ],
  exports: [
    LocalSearchService,
    GeocodeService,
    ReverseGeocodeService,
  ],
})
/**
 * ツールモジュール
 * Yahoo APIツールサービスを統合します
 */
export class ToolsModule {}
