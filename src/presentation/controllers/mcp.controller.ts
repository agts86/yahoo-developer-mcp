import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  Headers, 
  UseGuards, 
  UseInterceptors,
  Get,
  Logger
} from '@nestjs/common';
import { YahooApiKeyGuard } from '../guards/yahoo-api-key.guard.js';
import { AppConfigProvider } from '../../infrastructure/config/app-config.provider.js';
import { McpService } from '../../application/mcp/mcp.service.js';
import { SSEInterceptor } from '../interceptors/sse.interceptor.js';
import type { McpMessage } from '../../domain/mcp/mcp-message.interface.js';
import type { McpToolDefinition } from '../../domain/mcp/tools/tool-definition.interface.js';
import type { ToolResponse, ToolErrorResponse, McpServerInfo } from '../../domain/mcp/tool-response.interface.js';

/**
 * MCP ToolのHTTP APIコントローラー
 * ユーザーが指定したHTTPベース設定に対応し、MCPプロトコルとツールをHTTPエンドポイントで公開します
 */
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  /**
   * McpControllerのインスタンスを作成します
   * @param mcpService - MCPサービス
   * @param configService - アプリケーション設定サービス
   */
  constructor(
    private readonly mcpService: McpService,
    private readonly configService: AppConfigProvider,
  ) {}

  /**
   * MCPプロトコルのベースエンドポイント
   * MCPクライアントが最初にアクセスするエンドポイント
   * SSE処理はSSEInterceptorで自動処理される
   */
  @Get()
  @UseInterceptors(SSEInterceptor)
  getMcpInfo(): McpServerInfo {
    this.logger.debug('MCP base endpoint accessed');
    // SSE処理はインターセプターが自動処理
    // 通常のJSONレスポンスのみここで処理
    return this.mcpService.getMcpInfoResponse();
  }

  /**
   * MCPプロトコルのPOSTリクエストを処理（initialize, tools/list, tools/call等）
   * @param body - リクエストボディ
   * @param authHeader - Authorizationヘッダー（オプション）
   * @returns MCPレスポンス
   */
  @Post()
  async handleMcpPost(
    @Body() body: McpMessage,
    @Headers('authorization') authHeader?: string
  ): Promise<unknown> {
    this.logger.debug(`MCP POST Message: ${JSON.stringify(body)}`);

    try {
      return await this.mcpService.handleHttpMcpMessage(body, authHeader);
    } catch (error) {
      return this.mcpService.handleHttpMcpError(error, body?.id);
    }
  }



  /**
   * 利用可能なツール一覧を取得
   * @returns ツール一覧レスポンス
   */
  @Get('tools')
  @UseGuards(YahooApiKeyGuard)  
  getTools(): { tools: McpToolDefinition[] } {
    return {
      tools: this.mcpService.getHttpToolsDefinition()
    };
  }

  /**
   * ツールを実行し、結果を返す
   * @param toolName ツール名
   * @param input ツールの入力パラメータ
   * @param authHeader Authorization ヘッダー
   */
  @Post('tools/:toolName')
  @UseGuards(YahooApiKeyGuard)
  async invokeTool(
    @Param('toolName') toolName: string,
    @Body() input: Record<string, unknown>,
    @Headers('authorization') authHeader?: string
  ): Promise<ToolResponse | ToolErrorResponse> {
    this.logger.debug(`Tool invocation: ${toolName} with input: ${JSON.stringify(input)}`);

    try {
      const yahooAppId = this.configService.extractYahooApiKey(authHeader);
      const result = await this.mcpService.executeToolByName(toolName, input, yahooAppId);
      return this.mcpService.formatToolResponse(result);
    } catch (error) {
      return this.mcpService.formatToolError(error);
    }
  }

}
