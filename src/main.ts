import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

/**
 * アプリケーションのブートストラップ関数
 * NestJS Fastifyサーバーを起動し、CORS設定を適用します
 */
async function bootstrap() {
  // HTTPモード: NestJS Fastifyサーバーを起動
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );
  
  // CORS設定 - VS CodeのMCP拡張からのアクセスを許可
  app.enableCors({
    origin: true, // すべてのオリジンを許可（開発環境用）
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Yahoo Developer MCP Server running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});
