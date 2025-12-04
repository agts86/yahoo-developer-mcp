import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
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
}

type McpRpcError = Error & { code?: number; id?: string };
