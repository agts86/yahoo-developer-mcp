/**
 * MCPプロトコルの基本レスポンス型
 */
export interface McpResponse<T = unknown> {
  jsonrpc: '2.0';
  id?: string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * MCP初期化レスポンス型
 */
export interface McpInitializeResponse {
  jsonrpc: '2.0';
  id?: string;
  result: {
    protocolVersion: string;
    capabilities: {
      tools: { listChanged: boolean };
      logging: {
        levels: string[];
      };
    };
    serverInfo: {
      name: string;
      version: string;
    };
  };
}

/**
 * MCPレスポンス基本型
 */
export interface McpBaseResponse<T = unknown> {
  jsonrpc: '2.0';
  id?: string;
  result?: T;
}

/**
 * ツール実行結果型
 */
export interface McpToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}