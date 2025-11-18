import { localSearchTool } from '../../src/tools/localSearch.js';
import { YahooClient } from '../../src/client/yahooClient.js';
import { createSequentialResponses } from '../mocks/mockHttpClient.js';

describe('localSearchTool paging behavior', () => {
  test('nextOffset increments by 10 default', async () => {
    const responses = [
      { Feature: [{ Name: 'First', Geometry: { Coordinates: '139.0,35.0' }, Property: {} }] },
      { Feature: [{ Name: 'Second', Geometry: { Coordinates: '139.1,35.1' }, Property: {} }] }
    ];
    const mockHttp = createSequentialResponses(responses);
    const client = new YahooClient(mockHttp);
    const first = await localSearchTool(client, { query: 'ramen', sessionId: 'sess' });
    expect(first.nextOffset).toBe(10);
    const second = await localSearchTool(client, { query: 'ramen', sessionId: 'sess' });
    expect(second.nextOffset).toBe(20);
  });

  test('reset returns to first page', async () => {
    const responses = [
      { Feature: [{ Name: 'First', Geometry: { Coordinates: '139.0,35.0' }, Property: {} }] },
      { Feature: [{ Name: 'Second', Geometry: { Coordinates: '139.1,35.1' }, Property: {} }] }
    ];
    const mockHttp = createSequentialResponses(responses);
    const client = new YahooClient(mockHttp);
    await localSearchTool(client, { query: 'cafe', sessionId: 'sess2' });
    const resetPage = await localSearchTool(client, { query: 'cafe', sessionId: 'sess2', reset: true });
    expect(resetPage.nextOffset).toBe(10);
  });
});
