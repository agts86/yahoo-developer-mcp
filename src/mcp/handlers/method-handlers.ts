import { Injectable, Logger } from '@nestjs/common';
import { McpMethodHandler } from '../method-handler.interface.js';
import { McpToolWithDefinition } from '../../tools/tool-definition.interface.js';
import { AppConfigService } from '../../config/config.js';

@Injectable()
export class InitializeHandler implements McpMethodHandler {
  readonly method = 'initialize';
  private readonly logger = new Logger(InitializeHandler.name);

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

@Injectable()
export class NotificationsInitializedHandler implements McpMethodHandler {
  readonly method = 'notifications/initialized';
  private readonly logger = new Logger(NotificationsInitializedHandler.name);

  handle() {
    this.logger.log('HTTP MCP client initialized');
    return; // notification なのでレスポンス不要
  }
}

@Injectable()
export class LoggingSetLevelHandler implements McpMethodHandler {
  readonly method = 'logging/setLevel';
  private readonly logger = new Logger(LoggingSetLevelHandler.name);

  handle(message: any) {
    this.logger.log(`Setting log level to: ${message.params?.level || 'info'}`);
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {}
    };
  }
}

@Injectable()
export class ToolsListHandler implements McpMethodHandler {
  readonly method = 'tools/list';

  constructor(private readonly tools: McpToolWithDefinition[]) {}

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

@Injectable()
export class ToolsCallHandler implements McpMethodHandler {
  readonly method = 'tools/call';
  private readonly logger = new Logger(ToolsCallHandler.name);

  constructor(
    private readonly tools: McpToolWithDefinition[],
    private readonly configService: AppConfigService
  ) {}

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