import { LocalSearchService } from '../../src/tools/local-search.service.js';
import { YahooService } from '../../src/yahoo/yahoo.service.js';
import { FetchHttpClient } from '../../src/http/fetchClient.js';

// YahooServiceのモック
const mockYahooService = {
  localSearch: jest.fn()
};

describe('LocalSearchService', () => {
  let service: LocalSearchService;

  beforeEach(() => {
    service = new LocalSearchService(mockYahooService as any);
    jest.clearAllMocks();
  });

  test('should execute local search with yahoo app id', async () => {
    const mockResult = {
      items: [{ name: 'Test Location', lat: 35.0, lng: 139.0 }],
      raw: {}
    };
    mockYahooService.localSearch.mockResolvedValue(mockResult);

    const input = { query: 'ramen' };
    const yahooAppId = 'test-app-id';
    
    const result = await service.execute(input, yahooAppId);
    
    expect(mockYahooService.localSearch).toHaveBeenCalledWith(input, yahooAppId);
    expect(result).toEqual(mockResult);
  });

  test('should return tool definition', () => {
    const definition = service.getDefinition();
    
    expect(definition.name).toBe('localSearch');
    expect(definition.description).toContain('Yahoo!');
    expect(definition.inputSchema.type).toBe('object');
    expect(definition.inputSchema.properties).toHaveProperty('query');
    expect(definition.inputSchema.properties).toHaveProperty('lat');
    expect(definition.inputSchema.properties).toHaveProperty('lng');
  });
});
