import { GeocodeService } from '../../../../src/application/mcp/tools/geocode.service.js';
import { IMcpRepository } from '../../../../src/domain/mcp/imcp.repository.js';

const mockMcpRepository: Pick<IMcpRepository, 'geocode'> = {
  geocode: jest.fn()
};

describe('GeocodeService', () => {
  let service: GeocodeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeocodeService(mockMcpRepository as any);
  });

  test('Yahoo App ID を付与して geocode を呼び出す', async () => {
    const mockResult = {
      items: [{
        name: '東京駅',
        address: '東京都千代田区丸の内',
        lat: 35.681236,
        lng: 139.767125
      }],
      raw: {}
    };
    (mockMcpRepository.geocode as jest.Mock).mockResolvedValue(mockResult);

    const input = { query: '東京駅' };
    const yahooAppId = 'test-app-id';

    const result = await service.execute(input, yahooAppId);

    expect(mockMcpRepository.geocode).toHaveBeenCalledWith({
      appid: yahooAppId,
      output: 'json',
      query: '東京駅'
    });
    expect(result).toEqual(mockResult);
  });

  test('query が無い場合はエラー', async () => {
    const yahooAppId = 'test-app-id';
    await expect(service.execute({ query: '' } as any, yahooAppId)).rejects.toThrow('geocode requires query');
  });

  test('ツール定義がスキーマを含む', () => {
    const definition = service.getDefinition();

    expect(definition).toMatchObject({
      name: 'geocode',
      description: expect.stringContaining('Yahoo'),
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: expect.objectContaining({
          query: expect.objectContaining({ type: 'string' })
        })
      }
    });
  });
});
