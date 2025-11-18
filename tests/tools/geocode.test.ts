import { geocodeTool } from '../../src/tools/geocode.js';
import { YahooClient } from '../../src/client/yahooClient.js';
import { createSequentialResponses } from '../mocks/mockHttpClient.js';

describe('geocodeTool', () => {
  test('successfully geocodes address to coordinates', async () => {
    const mockResponse = {
      Feature: [{
        Geometry: {
          Coordinates: '139.691706,35.689521'
        },
        Property: {
          Address: '東京都新宿区新宿3-38-1'
        }
      }]
    };
    
    const mockHttp = createSequentialResponses([mockResponse]);
    const client = new YahooClient(mockHttp);
    
    const result = await geocodeTool(client, { query: '東京都新宿区新宿' });
    
    expect(result.items).toHaveLength(1);
    expect(result.items[0].lat).toBe(35.689521);
    expect(result.items[0].lng).toBe(139.691706);
    expect(result.items[0].address).toBe('東京都新宿区新宿3-38-1');
    expect(result.raw.Feature).toHaveLength(1);
  });

  test('handles empty results', async () => {
    const mockResponse = {
      Feature: []
    };
    
    const mockHttp = createSequentialResponses([mockResponse]);
    const client = new YahooClient(mockHttp);
    
    const result = await geocodeTool(client, { query: '存在しない住所' });
    
    expect(result.items).toHaveLength(0);
    expect(result.raw.Feature).toHaveLength(0);
  });

  test('handles multiple geocoding results', async () => {
    const mockResponse = {
      Feature: [
        {
          Geometry: { Coordinates: '139.691706,35.689521' },
          Property: { Address: '東京都新宿区新宿3-38-1' }
        },
        {
          Geometry: { Coordinates: '139.700000,35.690000' },
          Property: { Address: '東京都新宿区新宿4-1-1' }
        }
      ]
    };
    
    const mockHttp = createSequentialResponses([mockResponse]);
    const client = new YahooClient(mockHttp);
    
    const result = await geocodeTool(client, { query: '新宿' });
    
    expect(result.items).toHaveLength(2);
    expect(result.items[0].address).toBe('東京都新宿区新宿3-38-1');
    expect(result.items[1].address).toBe('東京都新宿区新宿4-1-1');
    expect(result.raw.Feature).toHaveLength(2);
  });
});