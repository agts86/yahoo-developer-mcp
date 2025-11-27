import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpModule } from './presentation/mcp/mcp.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    McpModule,
  ],
})
/**
 * アプリケーションのルートモジュール
 * 全てのモジュールを統合し、NestJSアプリケーションの構成を定義します
 */
export class AppModule {}
