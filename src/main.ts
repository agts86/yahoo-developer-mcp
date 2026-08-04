import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { McpService } from './application/mcp/mcp.service.js';
import { StdioSafeLogger } from './infrastructure/logging/stdio-safe-logger.js';

/**
 * アプリケーションのブートストラップ関数
 * MCP_MODE環境変数に応じてstdio/HTTPのいずれかでサーバーを起動します
 */
async function bootstrap(): Promise<void> {
  if (process.env.MCP_MODE === 'stdio') {
    await bootstrapStdio();
    return;
  }

  await bootstrapHttp();
}

/**
 * stdioモードのブートストラップ関数
 * MCPプロトコルがstdoutを専有するため、Nestの全ログをstderrへ退避します
 */
async function bootstrapStdio(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: new StdioSafeLogger(),
  });
  const mcpService = app.get(McpService);
  await mcpService.startStdioServer();
}

/**
 * HTTPモードのブートストラップ関数
 * NestJS Fastifyサーバーを起動し、CORS設定を適用します
 */
async function bootstrapHttp(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
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

  // SIGTERM/SIGINT受信時にFastifyを安全にクローズ（Vercelのスケールダウン対応）
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '::'; // IPv4/IPv6両対応のためデフォルトは"::"
  await app.listen(port, host);
  logger.log(
    `Yahoo Developer MCP Server running on http://${host === '::' ? 'localhost' : host}:${port}`,
  );
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
