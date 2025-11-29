import { LocalSearchService } from '../../../../src/application/mcp/tools/local-search.service.js';
import { IMcpRepository } from '../../../../src/domain/mcp/imcp.repository.js';
import { getAndAdvance } from '../../../../src/application/mcp/paging/pagingStateManager.js';

jest.mock('../../../../src/application/mcp/paging/pagingStateManager.js', () => ({
  getAndAdvance: jest.fn()
}));

const mockMcpRepository: Pick<IMcpRepository, 'localSearch'> = {
  localSearch: jest.fn()
};

describe('LocalSearchService', () => {
  let service: LocalSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LocalSearchService(mockMcpRepository as any);
  });

  test('query を指定してデフォルト10件で検索する', async () => {
    const mockResult = {
      items: [{ name: 'Test Location', lat: 35.0, lng: 139.0 }],
      raw: {}
    };
    (mockMcpRepository.localSearch as jest.Mock).mockResolvedValue(mockResult);

    const result = await service.execute({ query: 'ramen' }, 'test-app-id');

    expect(mockMcpRepository.localSearch).toHaveBeenCalledWith({
      appid: 'test-app-id',
      output: 'json',
      query: 'ramen',
      lat: undefined,
      lon: undefined,
      start: 1,
      results: 10
    });
    expect(result).toEqual({ ...mockResult, nextOffset: undefined });
  });

  test('sessionId と pagingStateManager を使って offset を進める', async () => {
    const mockResult = { items: [], raw: {} };
    (mockMcpRepository.localSearch as jest.Mock).mockResolvedValue(mockResult);
    (getAndAdvance as jest.Mock).mockReturnValue({ offset: 20, nextOffset: 30 });

    const result = await service.execute(
      { query: 'cafe', sessionId: 'abc', offset: undefined, results: 5 },
      'test-app-id'
    );

    expect(getAndAdvance).toHaveBeenCalledWith(
      { sessionId: 'abc', hash: JSON.stringify({ q: 'cafe', lat: undefined, lng: undefined }) },
      5,
      false,
      undefined
    );
    expect(mockMcpRepository.localSearch).toHaveBeenCalledWith({
      appid: 'test-app-id',
      output: 'json',
      query: 'cafe',
      lat: undefined,
      lon: undefined,
      start: 21,
      results: 5
    });
    expect(result.nextOffset).toBe(30);
  });

  test('query も座標も無い場合はエラー', async () => {
    await expect(service.execute({}, 'test-app-id')).rejects.toThrow('localSearch requires either query or lat+lng');
  });

  test('ツール定義がスキーマを含む', () => {
    const definition = service.getDefinition();

    expect(definition).toMatchObject({
      name: 'localSearch',
      description: expect.stringContaining('Yahoo'),
      inputSchema: {
        type: 'object',
        properties: expect.objectContaining({
          query: expect.any(Object),
          lat: expect.any(Object),
          lng: expect.any(Object),
          sessionId: expect.any(Object),
          offset: expect.any(Object),
          reset: expect.any(Object),
          results: expect.any(Object)
        })
      }
    });
  });
});
