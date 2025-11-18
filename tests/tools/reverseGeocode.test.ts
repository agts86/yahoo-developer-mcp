import { reverseGeocodeTool } from '../../src/tools/reverseGeocode.js';
import { YahooClient } from '../../src/client/yahooClient.js';
import { createSequentialResponses } from '../mocks/mockHttpClient.js';

describe('reverseGeocodeTool', () => {
  test('successfully reverse geocodes coordinates to address', async () => {
    const mockResponse = {
      Feature: [{
        Name: '東京都新宿区新宿',
        Property: {
          Address: '東京都新宿区新宿3-38-1'
        }
      }]
    };
    
    const mockHttp = createSequentialResponses([mockResponse]);
    const client = new YahooClient(mockHttp);
    
    const result = await reverseGeocodeTool(client, { lat: 35.689521, lng: 139.691706 });
    
    expect(result.items).toHaveLength(1);
    expect(result.items[0].address).toBe('東京都新宿区新宿3-38-1');
    expect(result.items[0].name).toBe('東京都新宿区新宿');
    expect(result.raw.Feature).toHaveLength(1);
  });

  test('handles empty results for invalid coordinates', async () => {
    const mockResponse = {
      Feature: []
    };
    
    const mockHttp = createSequentialResponses([mockResponse]);
    const client = new YahooClient(mockHttp);
    
    const result = await reverseGeocodeTool(client, { lat: 0, lng: 0 });
    
    expect(result.items).toHaveLength(0);
    expect(result.raw.Feature).toHaveLength(0);
  });

  test('handles multiple reverse geocoding results', async () => {
    const mockResponse = {
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
    };
    
    const mockHttp = createSequentialResponses([mockResponse]);
    const client = new YahooClient(mockHttp);
    
    const result = await reverseGeocodeTool(client, { lat: 35.689521, lng: 139.691706 });
    
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('東京都新宿区新宿');
    expect(result.items[1].name).toBe('東京都新宿区歌舞伎町');
    expect(result.raw.Feature).toHaveLength(2);
  });

  test('handles coordinates with decimal precision', async () => {
    const mockResponse = {
      Feature: [{
        Name: '東京駅',
        Property: {
          Address: '東京都千代田区丸の内1-9-1'
        }
      }]
    };
    
    const mockHttp = createSequentialResponses([mockResponse]);
    const client = new YahooClient(mockHttp);
    
    const result = await reverseGeocodeTool(client, { lat: 35.681236, lng: 139.767125 });
    
    expect(result.items).toHaveLength(1);
    expect(result.items[0].address).toBe('東京都千代田区丸の内1-9-1');
    expect(result.items[0].name).toBe('東京駅');
  });
});