import { ReverseGeocodeService } from '../../../../src/application/mcp/tools/reverse-geocode.service.js';
import { IMcpRepository } from '../../../../src/domain/mcp/imcp.repository.js';

const mockMcpRepository: Pick<IMcpRepository, 'reverseGeocode'> = {
  reverseGeocode: jest.fn()
};

describe('ReverseGeocodeService', () => {
  let service: ReverseGeocodeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReverseGeocodeService(mockMcpRepository as any);
  });

  test('lat/lng 付きでリポジトリを呼び出す', async () => {
    const mockResult = {
      items: [{
        name: '東京駅付近',
        address: '東京都千代田区丸の内'
      }],
      raw: {}
    };
    (mockMcpRepository.reverseGeocode as jest.Mock).mockResolvedValue(mockResult);

    const input = { lat: 35.681236, lng: 139.767125 };
    const yahooAppId = 'test-app-id';

    const result = await service.execute(input, yahooAppId);

    expect(mockMcpRepository.reverseGeocode).toHaveBeenCalledWith({
      appid: yahooAppId,
      output: 'json',
      lat: input.lat,
      lon: input.lng
    });
    expect(result).toEqual(mockResult);
  });

  test('lat または lng が無い場合はエラー', async () => {
    const yahooAppId = 'test-app-id';
    await expect(service.execute({ lat: 35.0 } as any, yahooAppId)).rejects.toThrow('reverseGeocode requires lat & lng');
    await expect(service.execute({ lng: 139.0 } as any, yahooAppId)).rejects.toThrow('reverseGeocode requires lat & lng');
  });

  test('ツール定義がスキーマを含む', () => {
    const definition = service.getDefinition();

    expect(definition).toMatchObject({
      name: 'reverseGeocode',
      description: expect.stringContaining('Yahoo'),
      inputSchema: {
        type: 'object',
        required: ['lat', 'lng'],
        properties: expect.objectContaining({
          lat: expect.objectContaining({ type: 'number' }),
          lng: expect.objectContaining({ type: 'number' })
        })
      }
    });
  });

  test('レスポンスの配列内容をそのまま返す', async () => {
    const mockResult = {
      items: [
        { name: '東京都新宿区新宿', address: '東京都新宿区新宿3-38-1' },
        { name: '東京都新宿区歌舞伎町', address: '東京都新宿区歌舞伎町1-1-1' }
      ],
      raw: { Feature: [] }
    };
    (mockMcpRepository.reverseGeocode as jest.Mock).mockResolvedValue(mockResult);

    const result = await service.execute({ lat: 35.689521, lng: 139.691706 }, 'test-app-id');

    expect(result.items.map(i => i.name)).toEqual(['東京都新宿区新宿', '東京都新宿区歌舞伎町']);
    expect(result.raw.Feature).toEqual([]);
  });
});
