import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { LocalSearchService } from '../tools/local-search.service.js';
import { GeocodeService } from '../tools/geocode.service.js';
import { ReverseGeocodeService } from '../tools/reverse-geocode.service.js';
import { AppConfigService } from '../config/config.js';
import { McpTool } from '../tools/tool.interface.js';
import { McpToolWithDefinition } from '../tools/tool-definition.interface.js';

/**
 * MCPサーバー統合サービス
 * HTTPモード専用のMCPツール実行サービス
 */
@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private readonly tools: McpToolWithDefinition[];

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
  }

  // --- HTTP MCP プロトコル処理メソッド ---

  /**
   * HTTP MCPメッセージを処理する
   */
  async handleHttpMcpMessage(message: any, authHeader?: string) {
    this.logger.debug(`Processing HTTP MCP message: ${message.method}`);
    return await this.dispatchHttpMcpMethod(message, authHeader);
  }

  /**
   * HTTP MCPメソッドのディスパッチ処理
   */
  private async dispatchHttpMcpMethod(message: any, authHeader?: string) {
    const method = message.method;

    switch (method) {
      case 'initialize':
        return this.createInitializeResponse(message);
      case 'notifications/initialized':
        return this.handleNotificationInitialized();
      case 'logging/setLevel':
        return this.handleLoggingSetLevel(message);
      case 'tools/list':
        return this.createToolsListResponse(message);
      case 'tools/call':
        const yahooAppId = this.configService.extractYahooApiKey(authHeader);
        return await this.handleHttpToolsCall(message, yahooAppId);
      default:
        throw this.createMethodNotFoundError(message.id, method);
    }
  }

  /**
   * HTTP MCP initialize レスポンスを作成
   */
  private createInitializeResponse(message: any) {
    this.logger.log('Handling HTTP MCP initialize request');
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false },
          logging: {
            levels: ['error', 'warn', 'info', 'debug']
          }
        },
        serverInfo: {
          name: 'yahoo-developer-mcp',
          version: '0.1.0'
        }
      }
    };
  }

  /**
   * HTTP MCP initialized 通知の処理
   */
  private handleNotificationInitialized() {
    this.logger.log('HTTP MCP client initialized');
    return; // notification なのでレスポンス不要
  }

  /**
   * HTTP MCP logging/setLevel の処理
   */
  private handleLoggingSetLevel(message: any) {
    this.logger.log(`Setting log level to: ${message.params?.level || 'info'}`);
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {}
    };
  }

  /**
   * HTTP MCP tools/list レスポンスを作成
   */
  private createToolsListResponse(message: any) {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: this.getHttpToolsDefinition()
      }
    };
  }

  /**
   * HTTP MCP tools/call の処理
   */
  private async handleHttpToolsCall(message: any, yahooAppId: string) {
    const { name, arguments: args } = message.params;
    try {
      const result = await this.executeToolByName(name, args, yahooAppId);
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    } catch (error) {
      this.logger.error(`Tool execution error: ${error}`, error);
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        }
      };
    }
  }

  /**
   * ツール名によるツール実行（HTTP用）
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
   */
  getHttpToolsDefinition() {
    return this.tools.map(tool => tool.getDefinition());
  }

  /**
   * メソッド未対応エラーの生成
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
