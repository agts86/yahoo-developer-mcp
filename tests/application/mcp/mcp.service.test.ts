import { HttpException } from '@nestjs/common';
import { McpService } from '../../../src/application/mcp/mcp.service.js';

describe('McpService', () => {
  const mockConfigService = {
    extractYahooApiKey: jest.fn()
  };

  const localSearchTool = {
    name: 'localSearch',
    execute: jest.fn(),
    getDefinition: jest.fn().mockReturnValue({ name: 'localSearch' })
  };
  const geocodeTool = {
    name: 'geocode',
    execute: jest.fn(),
    getDefinition: jest.fn().mockReturnValue({ name: 'geocode' })
  };
  const reverseGeocodeTool = {
    name: 'reverseGeocode',
    execute: jest.fn(),
    getDefinition: jest.fn().mockReturnValue({ name: 'reverseGeocode' })
  };

  let service: McpService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new McpService(
      localSearchTool as any,
      geocodeTool as any,
      reverseGeocodeTool as any,
      mockConfigService as any
    );
  });

  test('initialize メッセージをハンドラーで処理する', async () => {
    const message = { id: '1', method: 'initialize' };

    const result = await service.handleHttpMcpMessage(message);

    expect(result).toMatchObject({
      jsonrpc: '2.0',
      id: '1',
      result: {
        serverInfo: expect.objectContaining({ name: 'yahoo-developer-mcp' })
      }
    });
  });

  test('未知メソッドは MethodNotFoundError を投げる', async () => {
    await expect(service.handleHttpMcpMessage({ id: 'x', method: 'unknown' }))
      .rejects.toMatchObject({ name: 'MethodNotFoundError', message: 'Method not found: unknown' });
  });

  test('handleHttpMcpError が MethodNotFound を 400 に変換する', () => {
    const error = Object.assign(new Error('Method not found: foo'), { name: 'MethodNotFoundError', id: '123' });

    expect(() => service.handleHttpMcpError(error, '123')).toThrow(HttpException);
    try {
      service.handleHttpMcpError(error, '123');
    } catch (e) {
      const httpError = e as HttpException;
      expect(httpError.getStatus()).toBe(400);
      expect(httpError.getResponse()).toMatchObject({
        error: { code: -32601, message: 'Method not found: foo' }
      });
    }
  });

  test('executeToolByName でツールを実行する', async () => {
    const execResult = { ok: true };
    (geocodeTool.execute as jest.Mock).mockResolvedValue(execResult);

    const result = await service.executeToolByName('geocode', { q: 'tokyo' }, 'appid');

    expect(geocodeTool.execute).toHaveBeenCalledWith({ q: 'tokyo' }, 'appid');
    expect(result).toBe(execResult);
  });

  test('executeToolByName で存在しないツールなら UnknownToolError', async () => {
    await expect(service.executeToolByName('not-found', {}, 'appid'))
      .rejects.toMatchObject({ name: 'UnknownToolError', message: 'Unknown tool: not-found' });
  });

  test('formatToolResponse は JSON 文字列を content に含める', () => {
    const payload = { value: 1 };

    const response = service.formatToolResponse(payload);

    expect(response).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(payload, null, 2)
        }
      ]
    });
  });

  test('formatToolError は isError を付与する', () => {
    const err = new Error('boom');

    const response = service.formatToolError(err);

    expect(response).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error: boom'
        }
      ],
      isError: true
    });
  });

  test('getHttpToolsDefinition はツール定義を返す', () => {
    const defs = service.getHttpToolsDefinition();

    expect(defs).toEqual([
      { name: 'localSearch' },
      { name: 'geocode' },
      { name: 'reverseGeocode' }
    ]);
  });

  test('handleStreamableHttpRequest で必須ヘッダーを補完し処理を委譲する', async () => {
    const request = {
      raw: {
        headers: {},
        method: 'POST'
      },
      body: undefined
    } as any;
    const reply = {
      hijack: jest.fn(),
      raw: {
        on: jest.fn(),
        writableEnded: false,
        writeHead: jest.fn(),
        end: jest.fn()
      }
    } as any;

    const server = { connect: jest.fn(), close: jest.fn() };
    const transport = { handleRequest: jest.fn(), close: jest.fn() };

    jest.spyOn(service as any, 'createStreamableContext').mockReturnValue({ server, transport });
    const runSpy = jest.spyOn(service as any, 'runStreamableHandling').mockResolvedValue(undefined);

    await service.handleStreamableHttpRequest(request, reply);

    expect(request.raw.headers['accept']).toBe('application/json, text/event-stream');
    expect(request.raw.headers['content-type']).toBe('application/json');
    expect(reply.hijack).toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalledWith(request, reply, server, transport);
  });

  test('runStreamableHandling で例外時に 500 を返しクリーンアップする', async () => {
    const request = {
      raw: {
        headers: { accept: 'application/json' },
        method: 'GET',
        on: jest.fn()
      }
    } as any;
    const reply = {
      raw: {
        on: jest.fn(),
        writableEnded: false,
        writeHead: jest.fn(),
        end: jest.fn()
      }
    } as any;

    const server = {
      connect: jest.fn(),
      close: jest.fn()
    } as any;
    const transport = {
      handleRequest: jest.fn().mockRejectedValue(new Error('boom')),
      close: jest.fn()
    } as any;

    await (service as any).runStreamableHandling(request, reply, server, transport);

    expect(reply.raw.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' });
    expect(reply.raw.end).toHaveBeenCalled();
    expect(server.close).toHaveBeenCalled();
    expect(transport.close).toHaveBeenCalled();
  });
});
