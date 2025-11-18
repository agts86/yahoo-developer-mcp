import { YahooClient } from '../../src/client/yahooClient.js';
import { createSequentialResponses } from '../mocks/mockHttpClient.js';
import { FetchHttpClient } from '../../src/http/fetchClient.js';

// Basic tests using mock responses for paging

describe('YahooClient localSearch paging', () => {
  test('advances offset with session', async () => {
    const mockResponses = [
      { Feature: [{ Name: 'A', Geometry: { Coordinates: '139.0,35.0' }, Property: { Address: 'AddrA' } }] },
      { Feature: [{ Name: 'B', Geometry: { Coordinates: '139.1,35.1' }, Property: { Address: 'AddrB' } }] }
    ];
    const mockHttp = createSequentialResponses(mockResponses);
    const client = new YahooClient(mockHttp);

    const first = await client.localSearch({ query: 'coffee', sessionId: 's1' });
    expect(first.items[0].name).toBe('A');
    const second = await client.localSearch({ query: 'coffee', sessionId: 's1' });
    expect(second.items[0].name).toBe('B');
  });

  test('requires query or coordinates', async () => {
    const client = new YahooClient(new FetchHttpClient());
    await expect(client.localSearch({})).rejects.toThrow();
  });
});
