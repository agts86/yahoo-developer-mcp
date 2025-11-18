import { YahooClient } from '../client/yahooClient.js';
import { FetchHttpClient } from '../http/fetchClient.js';
import { localSearchTool } from '../tools/localSearch.js';
import { geocodeTool } from '../tools/geocode.js';
import { reverseGeocodeTool } from '../tools/reverseGeocode.js';

// Placeholder MCP server wiring using a simple dispatch pattern.
// Integrate with actual @modelcontextprotocol/sdk server constructs as needed.

export type ToolName = 'localSearch' | 'geocode' | 'reverseGeocode';

export interface ToolInvocation {
  name: ToolName;
  input: any;
}

export class MCPServer {
  private yahoo = new YahooClient(new FetchHttpClient());

  async invoke(invocation: ToolInvocation): Promise<any> {
    switch (invocation.name) {
      case 'localSearch':
        return localSearchTool(this.yahoo, invocation.input);
      case 'geocode':
        return geocodeTool(this.yahoo, invocation.input);
      case 'reverseGeocode':
        return reverseGeocodeTool(this.yahoo, invocation.input);
      default:
        throw new Error(`Unknown tool: ${invocation.name}`);
    }
  }
}
