import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module.js';
import { McpController } from './mcp.controller.js';
import { McpService } from './mcp.service.js';
import { AppConfigService } from '../config/config.js';
import { YahooApiKeyGuard } from './yahoo-api-key.guard.js';
import { SSEInterceptor } from './sse.interceptor.js';

@Module({
  imports: [ToolsModule],
  controllers: [McpController],
  providers: [
    McpService,
    AppConfigService,
    YahooApiKeyGuard,
    SSEInterceptor,
  ],
  exports: [McpService],
})
/**
 * MCPモジュール
 * Model Context Protocolの実装を提供します
 */
export class McpModule {}
