import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { ServerNotification, ServerRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { LocalSearchService } from './tools/local-search.service.js';
import { GeocodeService } from './tools/geocode.service.js';
import { ReverseGeocodeService } from './tools/reverse-geocode.service.js';
import { AppConfigProvider } from '../../infrastructure/config/app-config.provider.js';
import { McpToolDefinition, McpToolWithDefinition } from '../../domain/mcp/tools/tool-definition.interface.js';
import { McpMethodHandler } from '../../domain/mcp/method-handler.interface.js';
import { McpMessage } from '../../domain/mcp/mcp-message.interface.js';
import { ToolResponse, ToolErrorResponse, McpServerInfo } from '../../domain/mcp/tool-response.interface.js';
import { 
  InitializeHandler, 
  NotificationsInitializedHandler, 
  LoggingSetLevelHandler,
  ToolsListHandler,
  ToolsCallHandler 
} from './handlers/method-handlers.js';

/**
 * MCPサーバー統合サービス
 * HTTPモード専用のMCPツール実行サービス
 */
@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private readonly tools: McpToolWithDefinition[];
  private readonly methodHandlers: McpMethodHandler[];

  /**
   * McpServiceのインスタンスを作成します
   * @param localSearchService - ローカルサーチサービス
   * @param geocodeService - ジオコーダサービス
   * @param reverseGeocodeService - リバースジオコーダサービス
   * @param configService - アプリケーション設定サービス
   */
  constructor(
    private readonly localSearchService: LocalSearchService,
    private readonly geocodeService: GeocodeService,
    private readonly reverseGeocodeService: ReverseGeocodeService,
    private readonly configService: AppConfigProvider,
  ) {
    // ツールを配列で管理
    this.tools = [
      this.localSearchService,
      this.geocodeService,
      this.reverseGeocodeService,
    ];

    // メソッドハンドラーをクラスベースで管理
    this.methodHandlers = [
      new InitializeHandler(),
      new NotificationsInitializedHandler(),
      new LoggingSetLevelHandler(),
      new ToolsListHandler(this.tools),
      new ToolsCallHandler(this.tools, this.configService)
    ];
  }

  // --- HTTP MCP プロトコル処理メソッド ---

  /**
   * HTTP MCPメッセージを処理する
   * @param message - MCPメッセージ
   * @param authHeader - 認証ヘッダー（オプション）
   * @returns 処理結果
   */
  async handleHttpMcpMessage(message: McpMessage, authHeader?: string): Promise<unknown> {
    this.logger.debug(`Processing HTTP MCP message: ${message.method}`);
    return await this.dispatchHttpMcpMethod(message, authHeader);
  }

  /**
   * HTTP MCPメソッドのディスパッチ処理
   * @param message - MCPメッセージ
   * @param authHeader - 認証ヘッダー（オプション）
   * @returns メソッド実行結果
   * @throws メソッドが見つからない場合にエラーをスロー
   */
  private async dispatchHttpMcpMethod(message: McpMessage, authHeader?: string): Promise<unknown> {
    const method = message.method;
    const handler = this.methodHandlers.find(h => h.method === method);
    
    if (!handler) {
      const error = this.createMethodNotFoundError(message.id, method);
      throw error;
    }
    
    return await handler.handle(message, authHeader);
  }



  /**
   * ツール名によるツール実行（HTTP用）
   * @param toolName - 実行するツール名
   * @param input - ツールの入力パラメータ
   * @param yahooAppId - Yahoo API Key
   * @returns ツール実行結果
   * @throws ツールが見つからない場合にエラーをスロー
   */
  async executeToolByName(toolName: string, input: Record<string, unknown>, yahooAppId: string): Promise<unknown> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      const error = new Error(`Unknown tool: ${toolName}`);
      error.name = 'UnknownToolError';
      throw error;
    }
    return await tool.execute(input, yahooAppId);
  }

  /**
   * HTTP用ツール定義を取得（動的生成）
   * @returns ツール定義の配列
   */
  getHttpToolsDefinition(): McpToolDefinition[] {
    return this.tools.map(tool => tool.getDefinition());
  }

  /**
   * メソッド未対応エラーの生成
   * @param messageId - メッセージID
   * @param method - 未対応のメソッド名
   * @throws メソッド未対応エラーをスロー
   */
  private createMethodNotFoundError(messageId: string | undefined, method: string): McpRpcError {
    const error = new Error(`Method not found: ${method}`) as McpRpcError;
    error.name = 'MethodNotFoundError';
    error.code = -32601;
    error.id = messageId;
    return error;
  }

  /**
   * 例外をMCPエラー構造として扱えるように変換します
   */
  private toRpcError(error: unknown): McpRpcError | undefined {
    if (typeof error === 'object' && error !== null && 'name' in error) {
      return error as McpRpcError;
    }
    return undefined;
  }

  /**
   * ツール実行結果のフォーマット
   * @param result - ツール実行結果
   * @returns フォーマットされたレスポンス
   */
  formatToolResponse(result: unknown): ToolResponse {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  /**
   * ツール実行エラーのフォーマット
   * @param error - エラーオブジェクト
   * @returns フォーマットされたエラーレスポンス
   */
  formatToolError(error: unknown): ToolErrorResponse {
    this.logger.error(`Tool execution error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }

  /**
   * HTTP MCP エラーハンドリング
   * @param error - エラーオブジェクト
   * @param messageId - メッセージID（オプション）
   * @throws 適切なHTTPExceptionをスロー
   */
  handleHttpMcpError(error: unknown, messageId?: string): never {
    this.logger.error(`HTTP MCP Message handling error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    
    const rpcError = this.toRpcError(error);

    if (rpcError?.name === 'MethodNotFoundError') {
      throw new HttpException({
        jsonrpc: '2.0',
        id: rpcError.id || messageId,
        error: {
          code: -32601,
          message: rpcError.message
        }
      }, HttpStatus.BAD_REQUEST);
    }

    if (rpcError?.name === 'UnknownToolError') {
      throw new HttpException(rpcError.message, HttpStatus.BAD_REQUEST);
    }
    
    throw new HttpException({
      jsonrpc: '2.0',
      id: messageId,
      error: {
        code: -32603,
        message: 'Internal error',
        data: rpcError?.message ?? String(error)
      }
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * SSE (Server-Sent Events) 接続を処理する
   * @param reply - Fastifyレスポンスオブジェクト
   * @param request - Fastifyリクエストオブジェクト
   * @returns レスポンスオブジェクト
   */
  handleSSEConnection(reply: FastifyReply, request: FastifyRequest): FastifyReply {
    this.logger.debug('SSE connection requested');

    // Fastifyの自動レスポンス処理を停止し、手動でSSEレスポンスを制御
    reply.hijack();

    // SSEヘッダーを設定
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // MCP初期化メッセージを送信
    const initMessage = {
      jsonrpc: '2.0',
      method: 'initialized',
      params: {
        serverInfo: {
          name: 'yahoo-developer-mcp',
          version: '0.1.0'
        },
        capabilities: {
          tools: {
            listChanged: false
          }
        }
      }
    };
    
    reply.raw.write(`data: ${JSON.stringify(initMessage)}\n\n`);
    
    // キープアライブハートビート
    const heartbeat = setInterval(() => {
      reply.raw.write(': heartbeat\n\n');
    }, 30000);
    
    // クリーンアップ
    request.raw.on('close', () => {
      this.logger.debug('SSE connection closed');
      clearInterval(heartbeat);
    });
    
    return reply;
  }

  /**
   * MCP情報レスポンスを生成
   * @returns MCPサーバー情報レスポンス
   */
  getMcpInfoResponse(): McpServerInfo {
    return {
      name: 'yahoo-developer-mcp',
      version: '0.1.0',
      description: 'Yahoo Developer MCP Server - HTTP API',
      capabilities: {
        tools: true,
        resources: false,
        prompts: false
      },
      endpoints: {
        tools: '/mcp/tools',
        listTools: '/mcp/tools',
        invokeTool: '/mcp/tools/{toolName}'
      }
    };
  }

  /**
   * Codexが期待する Streamable HTTP MCP エンドポイントを処理
   * @param request - Fastifyリクエスト
   * @param reply - Fastifyレスポンス
   */
  async handleStreamableHttpRequest(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.ensureAcceptHeader(request);
    this.ensureContentTypeHeader(request);
    const { server, transport } = this.createStreamableContext();
    this.hijackReply(reply, server, transport);
    await this.runStreamableHandling(request, reply, server, transport);
  }

  /**
   * CodexクライアントがAcceptを省略する場合に備え、必須ヘッダーを補完
   */
  private ensureAcceptHeader(request: FastifyRequest): void {
    const acceptHeader = request.raw.headers['accept'];
    const accept = Array.isArray(acceptHeader) ? acceptHeader.join(',') : acceptHeader;

    const needsJson = !accept?.includes('application/json');
    const needsSse = !accept?.includes('text/event-stream');

    if (needsJson || needsSse || !accept) {
      request.raw.headers['accept'] = 'application/json, text/event-stream';
    }
  }

  /**
   * Content-Type: application/json が無い場合に補完 (POST時の 415 回避)
   */
  private ensureContentTypeHeader(request: FastifyRequest): void {
    if (request.raw.method !== 'POST') {
      return;
    }

    const contentType = request.raw.headers['content-type'];
    if (!contentType) {
      request.raw.headers['content-type'] = 'application/json';
    }
  }

  /**
   * Streamable HTTP用のサーバー/トランスポートをまとめて生成
   */
  private createStreamableContext(): {
    server: McpServer;
    transport: StreamableHTTPServerTransport;
  } {
    return {
      server: this.createStreamableMcpServer(),
      transport: this.createStreamableTransport()
    };
  }

  /**
   * Fastifyレスポンスをtransportに委譲し、クローズ時にクリーンアップ
   */
  private hijackReply(
    reply: FastifyReply,
    server: McpServer,
    transport: StreamableHTTPServerTransport
  ): void {
    reply.hijack();
    reply.raw.on('close', () => {
      void this.closeStreamableContext(server, transport);
    });
  }

  /**
   * Streamable HTTP の実行本体
   */
  private async runStreamableHandling(
    request: FastifyRequest,
    reply: FastifyReply,
    server: McpServer,
    transport: StreamableHTTPServerTransport
  ): Promise<void> {
    try {
      await server.connect(transport);
      await transport.handleRequest(request.raw, reply.raw, request.body);
    } catch (error) {
      this.logger.error(
        `Streamable HTTP handling error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );

      if (!reply.raw.writableEnded) {
        reply.raw.writeHead(500, { 'Content-Type': 'application/json' });
        reply.raw.end(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null
        }));
      }

      await this.closeStreamableContext(server, transport);
    }
  }

  /**
   * Streamable HTTP コンテキストの終了処理
   */
  private async closeStreamableContext(
    server: McpServer,
    transport: StreamableHTTPServerTransport
  ): Promise<void> {
    try {
      await server.close();
    } catch (error) {
      this.logger.error(
        `MCP server close error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
    }
    try {
      await transport.close();
    } catch (error) {
      this.logger.error(
        `MCP transport close error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  /**
   * streamable HTTP 用ツールの Zod スキーマをまとめて取得
   */
  private getStreamableSchemas(): {
    localSearch: z.ZodObject<{
      query: z.ZodOptional<z.ZodString>;
      lat: z.ZodOptional<z.ZodNumber>;
      lng: z.ZodOptional<z.ZodNumber>;
      sessionId: z.ZodOptional<z.ZodString>;
      offset: z.ZodOptional<z.ZodNumber>;
      reset: z.ZodOptional<z.ZodBoolean>;
      results: z.ZodOptional<z.ZodNumber>;
    }>;
    geocode: z.ZodObject<{ query: z.ZodString }>;
    reverseGeocode: z.ZodObject<{ lat: z.ZodNumber; lng: z.ZodNumber }>;
  } {
    return {
      localSearch: z.object({
        query: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        sessionId: z.string().optional(),
        offset: z.number().optional(),
        reset: z.boolean().optional(),
        results: z.number().optional()
      }),
      geocode: z.object({
        query: z.string()
      }),
      reverseGeocode: z.object({
        lat: z.number(),
        lng: z.number()
      })
    };
  }

  /**
   * streamable HTTP 用にツールを登録
   */
  private registerStreamableTools(
    server: McpServer,
    schemas: ReturnType<McpService['getStreamableSchemas']>
  ): void {
    this.registerStreamableTool(
      server,
      'localSearch',
      'Yahoo!ローカルサーチAPI - キーワードまたは座標でローカル検索（10件ページング対応）',
      schemas.localSearch,
      async (input, yahooAppId) => await this.localSearchService.execute(input, yahooAppId)
    );

    this.registerStreamableTool(
      server,
      'geocode',
      'Yahoo!ジオコーダAPI - 住所文字列から座標を取得',
      schemas.geocode,
      async (input, yahooAppId) => await this.geocodeService.execute(input, yahooAppId)
    );

    this.registerStreamableTool(
      server,
      'reverseGeocode',
      'Yahoo!リバースジオコーダAPI - 座標から住所を取得',
      schemas.reverseGeocode,
      async (input, yahooAppId) => await this.reverseGeocodeService.execute(input, yahooAppId)
    );
  }

  /**
   * 個別ツール登録ヘルパー
   */
  private registerStreamableTool<
    TInputSchema extends z.ZodType<object>,
    TInput = z.infer<TInputSchema>
  >(
    server: McpServer,
    name: string,
    description: string,
    inputSchema: TInputSchema,
    executor: (input: TInput, yahooAppId: string) => Promise<unknown>
  ): void {
    const callback = (async (
      args: z.infer<TInputSchema>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ): Promise<CallToolResult> => await this.executeStreamableTool(
      args as TInput,
      extra,
      executor
    )) as ToolCallback<TInputSchema>;

    server.registerTool(
      name,
      { description, inputSchema },
      callback
    );
  }

  /**
   * Streamable HTTP用のMCPサーバーを生成し、既存ツールを登録
   * @returns MCPサーバーインスタンス
   */
  private createStreamableMcpServer(): McpServer {
    const server = new McpServer({
      name: 'yahoo-developer-mcp',
      version: '0.1.0'
    });

    const schemas = this.getStreamableSchemas();
    this.registerStreamableTools(server, schemas);
    return server;
  }

  /**
   * Streamable HTTP用のtransportを生成
   * @returns transportインスタンス
   */
  private createStreamableTransport(): StreamableHTTPServerTransport {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true
    });

    transport.onerror = (error: Error): void => {
      this.logger.error(
        `Streamable transport error: ${error.message}`,
        error.stack
      );
    };

    return transport;
  }

  /**
   * ツール実行の共通処理 (Streamable HTTP向け)
   * @param input ツール入力
   * @param extra リクエスト付加情報
   * @param executor 実際のツール実行関数
   * @returns MCPツール実行結果
   */
  private async executeStreamableTool<TInput>(
    input: TInput,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    executor: (toolInput: TInput, yahooAppId: string) => Promise<unknown>
  ): Promise<CallToolResult> {
    try {
      const yahooAppId = this.extractYahooApiKeyFromExtra(extra);
      const result = await executor(input, yahooAppId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        structuredContent: this.toStructuredContent(result)
      };
    } catch (error) {
      this.logger.error(
        `Streamable tool execution error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * structuredContentに安全にセットできる形へ正規化
   * @param result ツール結果
   * @returns Record形式の結果
   */
  private toStructuredContent(result: unknown): Record<string, unknown> | undefined {
    if (result !== null && typeof result === 'object' && !Array.isArray(result)) {
      return result as Record<string, unknown>;
    }
    return undefined;
  }

  /**
   * AuthorizationヘッダーをRequestHandlerExtraから抽出
   * @param extra リクエスト付加情報
   * @returns 抽出したYahoo API Key
   */
  private extractYahooApiKeyFromExtra(
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): string {
    const authHeader = this.getAuthorizationHeader(extra);
    return this.configService.extractYahooApiKey(authHeader);
  }

  /**
   * requestInfoからAuthorizationヘッダーを取り出し、文字列に正規化
   * @param extra リクエスト付加情報
   * @returns Authorizationヘッダー文字列
   */
  private getAuthorizationHeader(
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): string | undefined {
    const headers = extra.requestInfo?.headers;
    const auth = headers?.authorization ?? headers?.Authorization;

    if (Array.isArray(auth)) {
      return auth[0];
    }

    return auth;
  }
}

type McpRpcError = Error & { code?: number; id?: string };
