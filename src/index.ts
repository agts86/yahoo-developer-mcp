import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { YahooClient } from './client/yahooClient.js';
import { FetchHttpClient } from './http/fetchClient.js';
import { localSearchTool } from './tools/localSearch.js';
import { geocodeTool } from './tools/geocode.js';
import { reverseGeocodeTool } from './tools/reverseGeocode.js';

const server = new Server(
  {
    name: "yahoo-developer",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const yahooClient = new YahooClient(new FetchHttpClient());

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'localSearch',
        description: 'Yahoo!ローカルサーチAPI - キーワードまたは座標でローカル検索（10件ページング対応）',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'キーワード検索文字列' },
            lat: { type: 'number', description: '緯度（座標検索の場合）' },
            lng: { type: 'number', description: '経度（座標検索の場合）' },
            sessionId: { type: 'string', description: 'ページング継続用セッションID' },
            offset: { type: 'number', description: '明示的オフセット指定' },
            reset: { type: 'boolean', description: 'ページングリセット' },
            results: { type: 'number', description: 'カスタムページサイズ（デフォルト10）' }
          }
        }
      },
      {
        name: 'geocode',
        description: 'Yahoo!ジオコーダAPI - 住所文字列から座標を取得',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '住所文字列' }
          },
          required: ['query']
        }
      },
      {
        name: 'reverseGeocode',
        description: 'Yahoo!リバースジオコーダAPI - 座標から住所を取得',
        inputSchema: {
          type: 'object',
          properties: {
            lat: { type: 'number', description: '緯度' },
            lng: { type: 'number', description: '経度' }
          },
          required: ['lat', 'lng']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    switch (name) {
      case 'localSearch':
        result = await localSearchTool(yahooClient, args as any);
        break;
      case 'geocode':
        result = await geocodeTool(yahooClient, args as any);
        break;
      case 'reverseGeocode':
        result = await reverseGeocodeTool(yahooClient, args as any);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  (process as any).exit(1);
});
