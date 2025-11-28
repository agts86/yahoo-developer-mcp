import { LocalSearchService } from '../../src/application/mcp/tools/local-search.service.js';
import { IMcpRepository } from '../../src/domain/mcp/imcp.repository.js';

// MCPリポジトリのモック
const mockMcpRepository: Pick<IMcpRepository, 'localSearch'> = {
  localSearch: jest.fn()
};

describe('LocalSearchService', () => {
  let service: LocalSearchService;

  beforeEach(() => {
    service = new LocalSearchService(mockMcpRepository as any);
    jest.clearAllMocks();
  });

  test('should execute local search with yahoo app id', async () => {
    const mockResult = {
      items: [{ name: 'Test Location', lat: 35.0, lng: 139.0 }],
      raw: {}
    };
    (mockMcpRepository.localSearch as jest.Mock).mockResolvedValue(mockResult);

    const input = { query: 'ramen' };
    const yahooAppId = 'test-app-id';
    
    const result = await service.execute(input, yahooAppId);
    
    expect(mockMcpRepository.localSearch).toHaveBeenCalledWith(input, yahooAppId);
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
