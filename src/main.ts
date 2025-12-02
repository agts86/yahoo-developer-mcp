import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

/**
 * アプリケーションのブートストラップ関数
 * NestJS Fastifyサーバーを起動し、CORS設定を適用します
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  // HTTPモード: NestJS Fastifyサーバーを起動
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // CORS設定 - VS CodeのMCP拡張からのアクセスを許可
  app.enableCors({
    origin: true, // すべてのオリジンを許可（開発環境用）
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  if (isDevelopment) {
    setupSwagger(app);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Yahoo Developer MCP Server running on http://localhost:${port}`);
  if (isDevelopment) {
    logger.log(`Swagger UI available at http://localhost:${port}/swagger`);
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Server startup error:', error);
  process.exit(1);
});

/**
 * 開発モード向けのSwaggerセットアップ
 * Fastify環境でOpenAPI/Swagger UIを有効化する
 */
function setupSwagger(app: NestFastifyApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Yahoo Developer MCP API')
    .setDescription('MCP HTTPエンドポイントの開発用ドキュメント')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);
}
