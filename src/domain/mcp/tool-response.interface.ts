/**
 * ツール実行結果のコンテンツ型
 */
export interface ToolContent {
  type: 'text';
  text: string;
}

/**
 * ツール実行レスポンス型（成功時）
 */
export interface ToolResponse {
  content: Array<ToolContent>;
}

/**
 * ツール実行エラーレスポンス型
 */
export interface ToolErrorResponse {
  content: Array<ToolContent>;
  isError: boolean;
}

/**
 * MCPサーバー情報レスポンス型
 */
export interface McpServerInfo {
  name: string;
  version: string;
  description: string;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  endpoints: {
    tools: string;
    listTools: string;
    invokeTool: string;
  };
}