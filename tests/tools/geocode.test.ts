import { GeocodeService } from '../../src/tools/geocode.service.js';
import { YahooService } from '../../src/yahoo/yahoo.service.js';

// YahooServiceのモック
const mockYahooService = {
  geocode: jest.fn()
};

describe('GeocodeService', () => {
  let service: GeocodeService;

  beforeEach(() => {
    service = new GeocodeService(mockYahooService as any);
    jest.clearAllMocks();
  });

  test('should execute geocode with yahoo app id', async () => {
    const mockResult = {
      items: [{
        name: '東京駅',
        address: '東京都千代田区丸の内',
        lat: 35.681236,
        lng: 139.767125
      }],
      raw: {}
    };
    mockYahooService.geocode.mockResolvedValue(mockResult);

    const input = { query: '東京駅' };
    const yahooAppId = 'test-app-id';
    
    const result = await service.execute(input, yahooAppId);
    
    expect(mockYahooService.geocode).toHaveBeenCalledWith(input, yahooAppId);
    expect(result).toEqual(mockResult);
  });

  test('should return tool definition', () => {
    const definition = service.getDefinition();
    
    expect(definition.name).toBe('geocode');
    expect(definition.description).toContain('Yahoo!');
    expect(definition.inputSchema.type).toBe('object');
    expect(definition.inputSchema.properties).toHaveProperty('query');
    expect(definition.inputSchema.required).toContain('query');
  });
});