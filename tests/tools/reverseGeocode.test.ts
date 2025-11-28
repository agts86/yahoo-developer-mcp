import { ReverseGeocodeService } from '../../src/application/mcp/tools/reverse-geocode.service.js';
import { IMcpRepository } from '../../src/domain/mcp/imcp.repository.js';

// MCPリポジトリのモック
const mockMcpRepository: Pick<IMcpRepository, 'reverseGeocode'> = {
  reverseGeocode: jest.fn()
};

describe('ReverseGeocodeService', () => {
  let service: ReverseGeocodeService;

  beforeEach(() => {
    service = new ReverseGeocodeService(mockMcpRepository as any);
    jest.clearAllMocks();
  });

  test('should execute reverse geocode with yahoo app id', async () => {
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
    
    expect(mockMcpRepository.reverseGeocode).toHaveBeenCalledWith(expect.objectContaining({
      appid: yahooAppId,
      lat: input.lat,
      lon: input.lng,
      output: 'json'
    }));
    expect(result).toEqual(mockResult);
  });

  test('should return tool definition', () => {
    const definition = service.getDefinition();
    
    expect(definition.name).toBe('reverseGeocode');
    expect(definition.description).toContain('Yahoo!');
    expect(definition.inputSchema.type).toBe('object');
    expect(definition.inputSchema.properties).toHaveProperty('lat');
    expect(definition.inputSchema.properties).toHaveProperty('lng');
    expect(definition.inputSchema.required).toContain('lat');
    expect(definition.inputSchema.required).toContain('lng');
  });

  test('should handle successful reverse geocoding with multiple results', async () => {
    const mockResult = {
      items: [
        {
          name: '東京都新宿区新宿',
          address: '東京都新宿区新宿3-38-1'
        },
        {
          name: '東京都新宿区歌舞伎町',
          address: '東京都新宿区歌舞伎町1-1-1'
        }
      ],
      raw: {
        Feature: [
          {
            Name: '東京都新宿区新宿',
            Property: { Address: '東京都新宿区新宿3-38-1' }
          },
          {
            Name: '東京都新宿区歌舞伎町',
            Property: { Address: '東京都新宿区歌舞伎町1-1-1' }
          }
        ]
      }
    };
    (mockMcpRepository.reverseGeocode as jest.Mock).mockResolvedValue(mockResult);

    const input = { lat: 35.689521, lng: 139.691706 };
    const yahooAppId = 'test-app-id';
    
    const result = await service.execute(input, yahooAppId);
    
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('東京都新宿区新宿');
    expect(result.items[1].name).toBe('東京都新宿区歌舞伎町');
  });

  test('should handle empty results for invalid coordinates', async () => {
    const mockResult = {
      items: [],
      raw: { Feature: [] }
    };
    (mockMcpRepository.reverseGeocode as jest.Mock).mockResolvedValue(mockResult);

    const input = { lat: 0, lng: 0 };
    const yahooAppId = 'test-app-id';
    
    const result = await service.execute(input, yahooAppId);
    
    expect(result.items).toHaveLength(0);
    expect(result.raw.Feature).toHaveLength(0);
  });
});
