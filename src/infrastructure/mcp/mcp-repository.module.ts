import { Module } from '@nestjs/common';
import { MCP_REPOSITORY } from '../../domain/mcp/imcp.repository.js';
import { HttpModule } from '../http/http.module.js';
import { McpRepository } from './mcp-repository.js';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: MCP_REPOSITORY,
      useClass: McpRepository,
    },
  ],
  exports: [MCP_REPOSITORY],
})
/**
 * MCPリポジトリのインフラモジュール
 * 外部API実装のDIバインドを集約します
 */
export class McpRepositoryModule {}
