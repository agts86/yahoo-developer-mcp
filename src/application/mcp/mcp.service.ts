import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { LocalSearchService } from '../tools/local-search.service.js';
import { GeocodeService } from '../tools/geocode.service.js';
import { ReverseGeocodeService } from '../tools/reverse-geocode.service.js';
import { AppConfigService } from '../../infrastructure/config/app-config.service.js';
import { McpToolWithDefinition } from '../../domain/tools/tool-definition.interface.js';
import { McpMethodHandler } from '../../domain/mcp/method-handler.interface.js';
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
    private readonly configService: AppConfigService,
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
  async handleHttpMcpMessage(message: any, authHeader?: string) {
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
  private async dispatchHttpMcpMethod(message: any, authHeader?: string) {
    const method = message.method;
    const handler = this.methodHandlers.find(h => h.method === method);
    
    if (!handler) {
      throw this.createMethodNotFoundError(message.id, method);
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
  async executeToolByName(toolName: string, input: any, yahooAppId: string) {
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
  getHttpToolsDefinition() {
    return this.tools.map(tool => tool.getDefinition());
  }

  /**
   * メソッド未対応エラーの生成
   * @param messageId - メッセージID
   * @param method - 未対応のメソッド名
   * @throws メソッド未対応エラーをスロー
   */
  private createMethodNotFoundError(messageId: string, method: string) {
    const error = new Error(`Method not found: ${method}`);
    error.name = 'MethodNotFoundError';
    (error as any).code = -32601;
    (error as any).id = messageId;
    throw error;
  }

  /**
   * ツール実行結果のフォーマット
   * @param result - ツール実行結果
   * @returns フォーマットされたレスポンス
   */
  formatToolResponse(result: any) {
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
  formatToolError(error: any) {
    this.logger.error(`Tool execution error: ${error}`, error);
    
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
   * @throws 適切なHTTPエクセプションをスロー
   */
  handleHttpMcpError(error: any, messageId?: string) {
    this.logger.error(`HTTP MCP Message handling error: ${error}`, error);
    
    if (error.name === 'MethodNotFoundError') {
      throw new HttpException({
        jsonrpc: '2.0',
        id: error.id || messageId,
        error: {
          code: -32601,
          message: error.message
        }
      }, HttpStatus.BAD_REQUEST);
    }

    if (error.name === 'UnknownToolError') {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    
    throw new HttpException({
      jsonrpc: '2.0',
      id: messageId,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error)
      }
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * SSE (Server-Sent Events) 接続を処理する
   * @param reply - Fastifyレスポンスオブジェクト
   * @param request - Fastifyリクエストオブジェクト
   * @returns レスポンスオブジェクト
   */
  handleSSEConnection(reply: any, request: any) {
    this.logger.debug('SSE connection requested');
    
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
  getMcpInfoResponse() {
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
