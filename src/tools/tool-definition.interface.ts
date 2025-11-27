import { McpTool } from './tool.interface.js';

/**
 * MCPツール定義インターフェース
 * ツールの定義情報を表します
 */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCPツールの拡張インターフェース
 * ツール定義情報を含むツールインターフェース
 */
export interface McpToolWithDefinition extends McpTool {
  /**
   * ツール定義を返します
   */
  getDefinition(): McpToolDefinition;
}