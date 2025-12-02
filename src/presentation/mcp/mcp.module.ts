import { Module } from '@nestjs/common';
import { McpController } from '../controllers/mcp.controller.js';
import { McpService } from '../../application/mcp/mcp.service.js';
import { AppConfigProvider } from '../../infrastructure/config/app-config.provider.js';
import { YahooApiKeyGuard } from '../guards/yahoo-api-key.guard.js';
import { SSEInterceptor } from '../interceptors/sse.interceptor.js';
import { LocalSearchService } from '../../application/mcp/tools/local-search.service.js';
import { GeocodeService } from '../../application/mcp/tools/geocode.service.js';
import { ReverseGeocodeService } from '../../application/mcp/tools/reverse-geocode.service.js';
import { McpRepositoryModule } from '../../infrastructure/mcp/mcp-repository.module.js';

@Module({
  imports: [McpRepositoryModule],
  controllers: [McpController],
  providers: [
    McpService,
    AppConfigProvider,
    YahooApiKeyGuard,
    SSEInterceptor,
    LocalSearchService,
    GeocodeService,
    ReverseGeocodeService,
  ],
  exports: [McpService],
})
/**
 * MCPモジュール
 * Model Context Protocolの実装を提供します
 */
export class McpModule {}
