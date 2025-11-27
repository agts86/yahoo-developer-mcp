import { Injectable, Logger } from '@nestjs/common';
import { McpMethodHandler } from '../../../domain/mcp/method-handler.interface.js';
import { McpToolWithDefinition } from '../../../domain/tools/tool-definition.interface.js';
import { AppConfigService } from '../../../infrastructure/config/app-config.service.js';

/**
 * MCP初期化ハンドラー
 * MCPプロトコルの初期化リクエストを処理します
 */
@Injectable()
export class InitializeHandler implements McpMethodHandler {
  readonly method = 'initialize';
  private readonly logger = new Logger(InitializeHandler.name);

  /**
   * 初期化メッセージを処理します
   * @param message - MCPメッセージ
   * @returns 初期化レスポンス
   */
  handle(message: any) {
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
}

/**
 * MCP初期化完了通知ハンドラー
 * クライアントの初期化完了通知を処理します
 */
@Injectable()
export class NotificationsInitializedHandler implements McpMethodHandler {
  readonly method = 'notifications/initialized';
  private readonly logger = new Logger(NotificationsInitializedHandler.name);

  /**
   * 初期化完了通知を処理します
   * @returns void（通知なのでレスポンス不要）
   */
  handle() {
    this.logger.log('HTTP MCP client initialized');
    return; // notification なのでレスポンス不要
  }
}

/**
 * ログレベル設定ハンドラー
 * MCPプロトコルのログレベル設定要求を処理します
 */
@Injectable()
export class LoggingSetLevelHandler implements McpMethodHandler {
  readonly method = 'logging/setLevel';
  private readonly logger = new Logger(LoggingSetLevelHandler.name);

  /**
   * ログレベル設定メッセージを処理します
   * @param message - MCPメッセージ
   * @returns ログレベル設定レスポンス
   */
  handle(message: any) {
    this.logger.log(`Setting log level to: ${message.params?.level || 'info'}`);
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {}
    };
  }
}

/**
 * ツールリストハンドラー
 * 利用可能なツールの一覧を返します
 */
@Injectable()
export class ToolsListHandler implements McpMethodHandler {
  readonly method = 'tools/list';

  /**
   * ToolsListHandlerのインスタンスを作成します
   * @param tools - 利用可能なツールの配列
   */
  constructor(private readonly tools: McpToolWithDefinition[]) {}

  /**
   * ツールリスト要求を処理します
   * @param message - MCPメッセージ
   * @returns ツールリストレスポンス
   */
  handle(message: any) {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: this.tools.map(tool => tool.getDefinition())
      }
    };
  }
}

/**
 * ツール実行ハンドラー
 * 指定されたツールを実行し、結果を返します
 */
@Injectable()
export class ToolsCallHandler implements McpMethodHandler {
  readonly method = 'tools/call';
  private readonly logger = new Logger(ToolsCallHandler.name);

  /**
   * ToolsCallHandlerのインスタンスを作成します
   * @param tools - 利用可能なツールの配列
   * @param configService - アプリケーション設定サービス
   */
  constructor(
    private readonly tools: McpToolWithDefinition[],
    private readonly configService: AppConfigService
  ) {}

  /**
   * ツール実行要求を処理します
   * @param message - MCPメッセージ
   * @param authHeader - 認証ヘッダー（オプション）
   * @returns ツール実行結果レスポンス
   */
  async handle(message: any, authHeader?: string) {
    const yahooAppId = this.configService.extractYahooApiKey(authHeader);
    const { name, arguments: args } = message.params;

    try {
      const tool = this.tools.find(t => t.name === name);
      if (!tool) {
        const error = new Error(`Unknown tool: ${name}`);
        error.name = 'UnknownToolError';
        throw error;
      }

      const result = await tool.execute(args, yahooAppId);
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
}
