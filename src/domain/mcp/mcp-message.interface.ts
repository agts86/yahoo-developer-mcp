/**
 * 共通のMCPメッセージ型
 */
export interface McpMessage<Params = unknown> {
  jsonrpc?: '2.0';
  id?: string;
  method: string;
  params?: Params;
}

/**
 * logging/setLevel 用パラメータ
 */
export interface LoggingSetLevelParams {
  level?: string;
}

/**
 * tools/call 用パラメータ
 */
export interface ToolsCallParams {
  name?: string;
  arguments?: unknown;
}
