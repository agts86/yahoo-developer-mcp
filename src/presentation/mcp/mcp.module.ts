import { Module } from '@nestjs/common';
import { McpController } from '../controllers/mcp.controller.js';
import { McpService } from '../../application/mcp/mcp.service.js';
import { AppConfigService } from '../../infrastructure/config/app-config.service.js';
import { YahooApiKeyGuard } from '../guards/yahoo-api-key.guard.js';
import { SSEInterceptor } from '../interceptors/sse.interceptor.js';
import { LocalSearchService } from '../../application/tools/local-search.service.js';
import { GeocodeService } from '../../application/tools/geocode.service.js';
import { ReverseGeocodeService } from '../../application/tools/reverse-geocode.service.js';
import { MCP_REPOSITORY } from '../../domain/mcp/mcp.repository.js';
import { YahooMcpRepository } from '../../infrastructure/yahoo/mcp.repository.js';
import { HttpModule } from '../../infrastructure/http/http.module.js';

@Module({
  imports: [HttpModule],
  controllers: [McpController],
  providers: [
    McpService,
    AppConfigService,
    YahooApiKeyGuard,
    SSEInterceptor,
    LocalSearchService,
    GeocodeService,
    ReverseGeocodeService,
    {
      provide: MCP_REPOSITORY,
      useClass: YahooMcpRepository,
    },
  ],
  exports: [McpService],
})
/**
 * MCPモジュール
 * Model Context Protocolの実装を提供します
 */
export class McpModule {}
