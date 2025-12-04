import { McpController } from '../../../src/presentation/controllers/mcp/mcp.controller.js';
import { McpService } from '../../../src/application/mcp/mcp.service.js';
import { AppConfigProvider } from '../../../src/infrastructure/config/app-config.provider.js';

describe('McpController', () => {
  let controller: McpController;

  type McpServiceMock = {
    getMcpInfoResponse: jest.Mock<ReturnType<McpService['getMcpInfoResponse']>>;
    handleHttpMcpMessage: jest.Mock<Promise<any>, [any, string?]>;
    handleHttpMcpError: jest.Mock<any, [any, string?]>;
    getHttpToolsDefinition: jest.Mock<any>;
    executeToolByName: jest.Mock<Promise<any>, [string, any, string]>;
    formatToolResponse: jest.Mock<any, [any]>;
    formatToolError: jest.Mock<any, [any]>;
    handleStreamableHttpRequest: jest.Mock<Promise<void>, [any, any]>;
  };

  const mockMcpService: McpServiceMock = {
    getMcpInfoResponse: jest.fn(),
    handleHttpMcpMessage: jest.fn(),
    handleHttpMcpError: jest.fn(),
    getHttpToolsDefinition: jest.fn(),
    executeToolByName: jest.fn(),
    formatToolResponse: jest.fn(),
    formatToolError: jest.fn(),
    handleStreamableHttpRequest: jest.fn()
  };

  const mockConfigService: jest.Mocked<Pick<AppConfigProvider, 'extractYahooApiKey'>> = {
    extractYahooApiKey: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new McpController(
      mockMcpService as unknown as McpService,
      mockConfigService as unknown as AppConfigProvider
    );
  });

  test('should return MCP info response', () => {
    const infoResponse: ReturnType<McpService['getMcpInfoResponse']> = {
      name: 'test',
      version: '1.0.0',
      description: 'desc',
      capabilities: {
        tools: true,
        resources: false,
        prompts: false
      },
      endpoints: {
        tools: '/tools',
        listTools: '/tools',
        invokeTool: '/tools/{toolName}'
      }
    };
    mockMcpService.getMcpInfoResponse.mockReturnValue(infoResponse);

    const result = controller.getMcpInfo();

    expect(mockMcpService.getMcpInfoResponse).toHaveBeenCalled();
    expect(result).toBe(infoResponse);
  });

  test('should handle MCP POST message successfully', async () => {
    const body = { method: 'initialize' };
    const authHeader = 'Bearer token';
    const expectedResponse = { ok: true };
    mockMcpService.handleHttpMcpMessage.mockResolvedValue(expectedResponse);

    const result = await controller.handleMcpPost(body, authHeader);

    expect(mockMcpService.handleHttpMcpMessage).toHaveBeenCalledWith(body, authHeader);
    expect(mockMcpService.handleHttpMcpError).not.toHaveBeenCalled();
    expect(result).toBe(expectedResponse);
  });

  test('should delegate MCP POST errors to handler', async () => {
    const body = { id: '123', method: 'unknown' };
    const error = new Error('unsupported');
    const handled = { jsonrpc: '2.0', error: { code: -32601 } };
    mockMcpService.handleHttpMcpMessage.mockRejectedValue(error);
    mockMcpService.handleHttpMcpError.mockReturnValue(handled);

    const result = await controller.handleMcpPost(body, undefined);

    expect(mockMcpService.handleHttpMcpMessage).toHaveBeenCalledWith(body, undefined);
    expect(mockMcpService.handleHttpMcpError).toHaveBeenCalledWith(error, body.id);
    expect(result).toBe(handled);
  });

  test('should return tool definitions for GET /tools', () => {
    const tools = [{ name: 'geocode' }];
    mockMcpService.getHttpToolsDefinition.mockReturnValue(tools as any);

    const result = controller.getTools();

    expect(mockMcpService.getHttpToolsDefinition).toHaveBeenCalled();
    expect(result).toEqual({ tools });
  });

  test('should invoke tool with extracted Yahoo API key', async () => {
    const toolName = 'geocode';
    const input = { query: 'Tokyo' };
    const authHeader = 'Bearer test-key';
    const yahooAppId = 'test-key';
    const executionResult = { data: 'result' };
    const formatted = { content: [{ type: 'text', text: 'formatted' }] };

    mockConfigService.extractYahooApiKey.mockReturnValue(yahooAppId);
    mockMcpService.executeToolByName.mockResolvedValue(executionResult);
    mockMcpService.formatToolResponse.mockReturnValue(formatted as any);

    const result = await controller.invokeTool(toolName, input, authHeader);

    expect(mockConfigService.extractYahooApiKey).toHaveBeenCalledWith(authHeader);
    expect(mockMcpService.executeToolByName).toHaveBeenCalledWith(toolName, input, yahooAppId);
    expect(mockMcpService.formatToolResponse).toHaveBeenCalledWith(executionResult);
    expect(result).toBe(formatted);
  });

  test('should format tool errors when invocation fails', async () => {
    const toolName = 'unknown';
    const input = { any: 'data' };
    const authHeader = 'Bearer token';
    const yahooAppId = 'token';
    const error = new Error('failure');
    const formattedError = { content: [{ type: 'text', text: 'Error' }], isError: true };

    mockConfigService.extractYahooApiKey.mockReturnValue(yahooAppId);
    mockMcpService.executeToolByName.mockRejectedValue(error);
    mockMcpService.formatToolError.mockReturnValue(formattedError as any);

    const result = await controller.invokeTool(toolName, input, authHeader);

    expect(mockConfigService.extractYahooApiKey).toHaveBeenCalledWith(authHeader);
    expect(mockMcpService.executeToolByName).toHaveBeenCalledWith(toolName, input, yahooAppId);
    expect(mockMcpService.formatToolError).toHaveBeenCalledWith(error);
    expect(result).toBe(formattedError);
  });

  test('should delegate streamable endpoint handling to service', async () => {
    const request = { raw: {} } as any;
    const reply = { raw: {} } as any;

    mockMcpService.handleStreamableHttpRequest.mockResolvedValue(undefined);

    await controller.handleStreamable(request, reply);

    expect(mockMcpService.handleStreamableHttpRequest).toHaveBeenCalledWith(request, reply);
  });
});
