import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YahooModule } from './yahoo/yahoo.module.js';
import { ToolsModule } from './tools/tools.module.js';
import { McpModule } from './mcp/mcp.module.js';
import { HttpModule } from './http/http.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    HttpModule,
    YahooModule,
    ToolsModule,
    McpModule,
  ],
})
/**
 * アプリケーションのルートモジュール
 * 全てのモジュールを統合し、NestJSアプリケーションの構成を定義します
 */
export class AppModule {}
